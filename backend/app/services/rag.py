from __future__ import annotations

import time
from datetime import datetime
from pathlib import Path

from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.documento import Documento, FragmentoDocumento
from app.services.embeddings import embed_text, embed_texts
from app.services.academic_guard import evaluar_alcance_academico
from app.services.llm import generar_respuesta, generar_titulo_conversacion
from app.services.pdf_loader import chunkear_pdf


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
    except Exception as exc:
        db.rollback()
        documento.estado = "error"
        documento.error_mensaje = str(exc)[:500]
        db.commit()
        return 0, str(exc)


def buscar_fragmentos(db: Session, pregunta: str, top_k: int | None = None) -> list[dict]:
    """Recuperación semántica con pgvector (cosine similarity)."""
    top_k = top_k or settings.TOP_K
    embedding = embed_text(pregunta)

    sql = text(
        """
        SELECT f.id_fragmento,
               f.id_documento,
               f.texto,
               f.metadatos,
               d.titulo,
               1 - (f.embedding <=> CAST(:emb AS vector)) AS score
          FROM fragmentos_documentos f
          JOIN documentos d ON d.id_documento = f.id_documento
         WHERE d.activo = TRUE AND d.estado = 'indexado'
         ORDER BY f.embedding <=> CAST(:emb AS vector)
         LIMIT :k
        """
    )
    rows = db.execute(sql, {"emb": str(embedding), "k": top_k}).mappings().all()
    return [dict(r) for r in rows]


def responder_pregunta(
    db: Session,
    pregunta: str,
) -> dict:
    """Pipeline RAG completo. Devuelve dict con respuesta, fuentes y métricas."""
    inicio = time.time()

    alcance = evaluar_alcance_academico(pregunta)
    if not alcance.permitida:
        latencia_ms = int((time.time() - inicio) * 1000)
        return {
            "contenido": alcance.mensaje,
            "fuentes": [],
            "tokens_entrada": 0,
            "tokens_salida": 0,
            "latencia_ms": latencia_ms,
            "modelo_llm": settings.LLM_MODEL,
            "fragmentos_ids": [],
            "scores": [],
        }

    fragmentos = buscar_fragmentos(db, pregunta)

    fragmentos_filtrados = [
        f for f in fragmentos if (f.get("score") or 0) >= settings.SCORE_THRESHOLD
    ]

    contexto = fragmentos_filtrados or []
    respuesta, t_in, t_out = generar_respuesta(pregunta, contexto)
    latencia_ms = int((time.time() - inicio) * 1000)

    fuentes = [
        {
            "id_fragmento": f["id_fragmento"],
            "titulo": f["titulo"],
            "pagina": (f.get("metadatos") or {}).get("pagina"),
            "score": round(float(f["score"]), 4),
        }
        for f in contexto
    ]

    return {
        "contenido": respuesta,
        "fuentes": fuentes,
        "tokens_entrada": t_in,
        "tokens_salida": t_out,
        "latencia_ms": latencia_ms,
        "modelo_llm": settings.LLM_MODEL,
        "fragmentos_ids": [f["id_fragmento"] for f in contexto],
        "scores": [round(float(f["score"]), 4) for f in contexto],
    }


def titulo_para_conversacion(pregunta: str) -> str:
    return generar_titulo_conversacion(pregunta)
