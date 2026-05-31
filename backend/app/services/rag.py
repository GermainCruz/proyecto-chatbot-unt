from __future__ import annotations

import re
import time
from datetime import datetime
from pathlib import Path

from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.documento import CategoriaDocumento, Documento, FragmentoDocumento
from app.services.embeddings import embed_text, embed_texts
from app.services.conversation import (
    detectar_intencion,
    expandir_consulta,
    formatear_historial,
    normalizar_pregunta,
)
from app.services.academic_guard import evaluar_alcance_academico
from app.services.llm import generar_respuesta, generar_titulo_conversacion
from app.services.pdf_loader import chunkear_pdf, PDFScannedError
from app.services.rag_filter import seleccionar_fragmentos


def indexar_documento(db: Session, documento: Documento) -> tuple[int, str | None]:
    """Procesa un PDF: extrae chunks, genera embeddings y los guarda.

    Devuelve (n_fragmentos, error_mensaje).
    """
    try:
        documento.estado = "procesando"
        documento.error_mensaje = None
        db.commit()

        ruta = Path(documento.ruta_archivo)
        if not ruta.exists():
            raise FileNotFoundError(f"Archivo no encontrado: {ruta}")

        chunks = chunkear_pdf(
            ruta,
            chunk_size=settings.CHUNK_SIZE,
            overlap=settings.CHUNK_OVERLAP,
        )
        if not chunks:
            raise ValueError("No se extrajo texto del PDF (¿es escaneado sin OCR?)")

        db.query(FragmentoDocumento).filter(
            FragmentoDocumento.id_documento == documento.id_documento
        ).delete()
        db.commit()

        textos = [c.texto for c in chunks]
        BATCH = 64
        embeddings: list[list[float]] = []
        for i in range(0, len(textos), BATCH):
            embeddings.extend(embed_texts(textos[i : i + BATCH]))

        for chunk, emb in zip(chunks, embeddings):
            db.add(
                FragmentoDocumento(
                    id_documento=documento.id_documento,
                    indice_chunk=chunk.indice,
                    texto=chunk.texto,
                    tokens=len(chunk.texto) // 4,
                    embedding=emb,
                    metadatos={"pagina": chunk.pagina, "titulo": documento.titulo},
                )
            )

        documento.estado = "indexado"
        documento.fecha_indexado = datetime.utcnow()
        db.commit()
        return len(chunks), None
    except PDFScannedError as exc:
        db.rollback()
        documento.estado = "requiere_revision"
        documento.error_mensaje = str(exc)
        db.commit()
        return 0, str(exc)
    except Exception as exc:
        db.rollback()
        documento.estado = "error"
        documento.error_mensaje = str(exc)[:500]
        db.commit()
        return 0, str(exc)


def buscar_fragmentos(
    db: Session,
    pregunta: str,
    top_k: int | None = None,
    *,
    id_categoria: int | None = None,
) -> list[dict]:
    """Recuperación semántica e híbrida con pgvector y pg_trgm."""
    top_k = top_k or settings.TOP_K
    embedding = embed_text(pregunta)

    # Hybrid search: Similitud HNSW + Similitud Trigram en palabras clave y título
    sql = text(
        """
        SELECT f.id_fragmento,
               f.id_documento,
               f.texto,
               f.metadatos,
               d.titulo,
               d.palabras_clave,
               1 - (f.embedding <=> CAST(:emb AS vector)) AS vector_score,
               similarity(COALESCE(d.palabras_clave, '') || ' ' || d.titulo, :pregunta) AS lexical_score
          FROM fragmentos_documentos f
          JOIN documentos d ON d.id_documento = f.id_documento
         WHERE d.activo = TRUE
           AND d.estado = 'indexado'
           AND (:id_categoria IS NULL OR d.id_categoria = :id_categoria)
         ORDER BY (1 - (f.embedding <=> CAST(:emb AS vector))) + 
                  (similarity(COALESCE(d.palabras_clave, '') || ' ' || d.titulo, :pregunta) * 0.3) DESC
         LIMIT :k
        """
    )
    rows = db.execute(
        sql,
        {"emb": str(embedding), "pregunta": pregunta, "k": top_k, "id_categoria": id_categoria},
    ).mappings().all()
    
    # Asignar el score combinado al campo 'score' para que funcione el resto de la lógica
    resultados = []
    for r in rows:
        d = dict(r)
        d["score"] = d["vector_score"] + (d["lexical_score"] * 0.3)
        resultados.append(d)
        
    return resultados


def responder_pregunta(
    db: Session,
    pregunta: str,
    historial_mensajes: list[dict] | None = None,
    *,
    id_categoria: int | None = None,
) -> dict:
    """Pipeline RAG completo. Devuelve dict con respuesta, fuentes y métricas."""
    inicio = time.time()
    try:
        alcance = evaluar_alcance_academico(pregunta)
        if not alcance.permitida:
            return {
                "contenido": alcance.mensaje,
                "fuentes": [],
                "tokens_entrada": 0,
                "tokens_salida": 0,
                "latencia_ms": int((time.time() - inicio) * 1000),
                "modelo_llm": settings.LLM_MODEL,
                "fragmentos_ids": [],
                "scores": [],
            }

        if id_categoria is not None:
            docs_idx = (
                db.scalar(
                    select(func.count(Documento.id_documento)).where(
                        Documento.id_categoria == id_categoria,
                        Documento.activo.is_(True),
                        Documento.estado == "indexado",
                    )
                )
                or 0
            )
            if int(docs_idx) == 0:
                cat = db.get(CategoriaDocumento, id_categoria)
                nombre_tema = (cat.descripcion or cat.nombre) if cat else f"ID {id_categoria}"
                msg = (
                    f'Disculpa, aún no cuento con documentos oficiales cargados para el tema "{nombre_tema}". '
                    "Por eso no puedo darte una respuesta precisa. "
                    "Si necesitas, un administrador puede subir PDFs en el panel de Documentos."
                )
                return {
                    "contenido": msg,
                    "fuentes": [],
                    "tokens_entrada": 0,
                    "tokens_salida": 0,
                    "latencia_ms": int((time.time() - inicio) * 1000),
                    "modelo_llm": settings.LLM_MODEL,
                    "fragmentos_ids": [],
                    "scores": [],
                }

        pregunta_norm, sugerencia_typo = normalizar_pregunta(pregunta)
        intent = detectar_intencion(pregunta_norm)
        historial = formatear_historial(historial_mensajes or [])

        # Si es un saludo corto, responder directamente sin búsqueda RAG
        if intent == "saludo" and len(pregunta_norm.split()) <= 3:
            respuesta, t_in, t_out = generar_respuesta(
                pregunta_norm,
                [],
                historial=historial,
                intent=intent,
                sugerencia_typo=sugerencia_typo,
            )
            return {
                "contenido": respuesta,
                "fuentes": [],
                "tokens_entrada": t_in,
                "tokens_salida": t_out,
                "latencia_ms": int((time.time() - inicio) * 1000),
                "modelo_llm": settings.LLM_MODEL,
                "fragmentos_ids": [],
                "scores": [],
            }

        # Búsqueda inicial con pregunta normalizada
        fragmentos = buscar_fragmentos(db, pregunta_norm, id_categoria=id_categoria)
        candidatos = [f for f in fragmentos if (f.get("score") or 0) >= settings.SCORE_THRESHOLD]

        para_llm, para_fuentes = seleccionar_fragmentos(
            pregunta_norm,
            candidatos,
            max_para_llm=settings.RAG_MAX_FRAGMENTOS_LLM,
            max_fuentes=settings.RAG_MAX_FUENTES,
            min_rank=settings.RAG_MIN_RANK,
        )

        # RETRY LOGIC: Si no hay resultados, intentar con expansión de consulta
        if not para_llm:
            pregunta_exp = expandir_consulta(pregunta_norm)
            if pregunta_exp != pregunta_norm:
                fragmentos_exp = buscar_fragmentos(db, pregunta_exp, id_categoria=id_categoria)
                candidatos_exp = [f for f in fragmentos_exp if (f.get("score") or 0) >= settings.SCORE_THRESHOLD]
                
                para_llm_exp, para_fuentes_exp = seleccionar_fragmentos(
                    pregunta_exp,
                    candidatos_exp,
                    max_para_llm=settings.RAG_MAX_FRAGMENTOS_LLM,
                    max_fuentes=settings.RAG_MAX_FUENTES,
                    min_rank=settings.RAG_MIN_RANK,
                )
                if para_llm_exp:
                    para_llm, para_fuentes = para_llm_exp, para_fuentes_exp

        # Si aún no hay fragmentos relevantes, responder con mensaje de disculpa
        if not para_llm:
            msg = "Disculpa, aún no cuento con información específica detallada sobre este tema en mis documentos actuales. Por favor, intenta reformular tu consulta con más contexto o contacta a la oficina correspondiente de la UNT."
            if sugerencia_typo:
                msg = f"{sugerencia_typo}\n\n{msg}"
            return {
                "contenido": msg,
                "fuentes": [],
                "tokens_entrada": 0,
                "tokens_salida": 0,
                "latencia_ms": int((time.time() - inicio) * 1000),
                "modelo_llm": settings.LLM_MODEL,
                "fragmentos_ids": [],
                "scores": [],
            }

        respuesta, t_in, t_out = generar_respuesta(
            pregunta_norm,
            para_llm,
            historial=historial,
            intent=intent,
            sugerencia_typo=sugerencia_typo,
        )
        latencia_ms = int((time.time() - inicio) * 1000)

        fuentes = [
            {
                "id_fragmento": f["id_fragmento"],
                "titulo": f["titulo"],
                "pagina": (f.get("metadatos") or {}).get("pagina"),
                "score": round(float(f.get("_rank", f.get("score", 0))), 4),
            }
            for f in para_fuentes
        ]

        return {
            "contenido": respuesta,
            "fuentes": fuentes,
            "tokens_entrada": t_in,
            "tokens_salida": t_out,
            "latencia_ms": latencia_ms,
            "modelo_llm": settings.LLM_MODEL,
            "fragmentos_ids": [f["id_fragmento"] for f in para_llm],
            "scores": [round(float(f.get("_rank", f.get("score", 0))), 4) for f in para_llm],
        }
    except Exception as e:
        from loguru import logger
        logger.error(f"Error interno en responder_pregunta: {str(e)}")
        return {
            "contenido": "Lo siento, ocurrió un error interno al procesar tu consulta. Por favor, intenta de nuevo más tarde.",
            "fuentes": [],
            "tokens_entrada": 0,
            "tokens_salida": 0,
            "latencia_ms": int((time.time() - inicio) * 1000),
            "modelo_llm": settings.LLM_MODEL,
            "fragmentos_ids": [],
            "scores": [],
        }


def titulo_para_conversacion(pregunta: str) -> str:
    return generar_titulo_conversacion(pregunta)
