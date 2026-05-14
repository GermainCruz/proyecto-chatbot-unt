from __future__ import annotations

import hashlib
import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal, get_db
from app.core.deps import require_admin
from app.models.conversacion import Conversacion, Mensaje
from app.models.documento import CategoriaDocumento, Documento, FragmentoDocumento
from app.models.usuario import Usuario
from app.schemas.documento import (
    CategoriaOut,
    DocumentoOut,
    MetricasOut,
    UsuarioAdminOut,
    UsuarioUpdateIn,
)
from app.services.rag import indexar_documento
from dotenv import set_key
from app.models.api_key import ApiKey
from app.schemas.api_key import ApiKeyCreate, ApiKeyOut


router = APIRouter(prefix="/admin", tags=["admin"])


# ---------- Categorías ----------

@router.get("/categorias", response_model=list[CategoriaOut])
def listar_categorias(db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    return db.execute(select(CategoriaDocumento).order_by(CategoriaDocumento.nombre)).scalars().all()


# ---------- Documentos ----------

def _to_documento_out(db: Session, doc: Documento) -> DocumentoOut:
    count = db.scalar(
        select(func.count(FragmentoDocumento.id_fragmento)).where(
            FragmentoDocumento.id_documento == doc.id_documento
        )
    ) or 0
    return DocumentoOut(
        id_documento=doc.id_documento,
        titulo=doc.titulo,
        descripcion=doc.descripcion,
        formato=doc.formato,
        estado=doc.estado,
        error_mensaje=doc.error_mensaje,
        tamano_bytes=doc.tamano_bytes,
        fecha_subida=doc.fecha_subida,
        fecha_indexado=doc.fecha_indexado,
        categoria=CategoriaOut.model_validate(doc.categoria) if doc.categoria else None,
        activo=doc.activo,
        fragmentos_count=int(count),
    )


@router.get("/documentos", response_model=list[DocumentoOut])
def listar_documentos(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    docs = db.execute(
        select(Documento).order_by(Documento.fecha_subida.desc())
    ).scalars().all()
    return [_to_documento_out(db, d) for d in docs]


def _procesar_en_background(documento_id: int) -> None:
    db = SessionLocal()
    try:
        doc = db.get(Documento, documento_id)
        if doc is None:
            return
        indexar_documento(db, doc)
    finally:
        db.close()


@router.post("/documentos", response_model=DocumentoOut, status_code=201)
def subir_documento(
    background_tasks: BackgroundTasks,
    titulo: str = Form(...),
    id_categoria: int | None = Form(None),
    descripcion: str | None = Form(None),
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin),
):
    if archivo.content_type not in {"application/pdf", "application/octet-stream"}:
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")
    if not archivo.filename or not archivo.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="El archivo debe tener extensión .pdf")

    storage = Path(settings.STORAGE_DIR)
    storage.mkdir(parents=True, exist_ok=True)
    ruta = storage / f"{uuid4().hex}.pdf"

    sha = hashlib.sha256()
    tamano = 0
    with ruta.open("wb") as out:
        while chunk := archivo.file.read(1024 * 1024):
            tamano += len(chunk)
            if tamano > settings.MAX_PDF_MB * 1024 * 1024:
                out.close()
                ruta.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail=f"PDF mayor a {settings.MAX_PDF_MB} MB")
            sha.update(chunk)
            out.write(chunk)
    archivo.file.close()
    hash_archivo = sha.hexdigest()

    duplicado = db.execute(
        select(Documento).where(Documento.hash_archivo == hash_archivo)
    ).scalar_one_or_none()
    if duplicado:
        ruta.unlink(missing_ok=True)
        raise HTTPException(status_code=409, detail="Ese archivo ya fue subido anteriormente")

    doc = Documento(
        id_categoria=id_categoria,
        titulo=titulo.strip()[:300],
        descripcion=descripcion,
        formato="pdf",
        ruta_archivo=str(ruta),
        hash_archivo=hash_archivo,
        tamano_bytes=tamano,
        estado="pendiente",
        subido_por=admin.id_usuario,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    background_tasks.add_task(_procesar_en_background, doc.id_documento)
    return _to_documento_out(db, doc)


@router.post("/documentos/{doc_id}/reprocesar", response_model=DocumentoOut)
def reprocesar_documento(
    doc_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    doc = db.get(Documento, doc_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    doc.estado = "pendiente"
    doc.error_mensaje = None
    db.commit()
    background_tasks.add_task(_procesar_en_background, doc.id_documento)
    return _to_documento_out(db, doc)


@router.delete("/documentos/{doc_id}", status_code=204)
def eliminar_documento(
    doc_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    doc = db.get(Documento, doc_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    ruta = Path(doc.ruta_archivo)
    if ruta.exists():
        ruta.unlink(missing_ok=True)
    db.delete(doc)
    db.commit()


# ---------- Usuarios ----------

@router.get("/usuarios", response_model=list[UsuarioAdminOut])
def listar_usuarios(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    return db.execute(select(Usuario).order_by(Usuario.fecha_registro.desc())).scalars().all()


@router.patch("/usuarios/{user_id}", response_model=UsuarioAdminOut)
def actualizar_usuario(
    user_id: int,
    payload: UsuarioUpdateIn,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin),
):
    user = db.get(Usuario, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.id_usuario == admin.id_usuario and payload.activo is False:
        raise HTTPException(status_code=400, detail="No puedes desactivar tu propia cuenta")
    if payload.rol is not None:
        if payload.rol not in {"estudiante", "administrador"}:
            raise HTTPException(status_code=400, detail="Rol inválido")
        user.rol = payload.rol
    if payload.activo is not None:
        user.activo = payload.activo
    db.commit()
    db.refresh(user)
    return user


# ---------- Métricas ----------

@router.get("/metricas", response_model=MetricasOut)
def metricas(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    total_users = db.scalar(select(func.count(Usuario.id_usuario))) or 0
    total_est = db.scalar(select(func.count()).where(Usuario.rol == "estudiante")) or 0
    total_adm = db.scalar(select(func.count()).where(Usuario.rol == "administrador")) or 0
    total_docs = db.scalar(select(func.count(Documento.id_documento))) or 0
    docs_idx = db.scalar(select(func.count()).where(Documento.estado == "indexado")) or 0
    total_frag = db.scalar(select(func.count(FragmentoDocumento.id_fragmento))) or 0
    total_conv = db.scalar(select(func.count(Conversacion.id_conversacion))) or 0
    total_msg = db.scalar(select(func.count(Mensaje.id_mensaje))) or 0
    msg_pos = db.scalar(select(func.count()).where(Mensaje.util == 1)) or 0
    msg_neg = db.scalar(select(func.count()).where(Mensaje.util == -1)) or 0

    return MetricasOut(
        total_usuarios=int(total_users),
        total_estudiantes=int(total_est),
        total_admins=int(total_adm),
        total_documentos=int(total_docs),
        documentos_indexados=int(docs_idx),
        total_fragmentos=int(total_frag),
        total_conversaciones=int(total_conv),
        total_mensajes=int(total_msg),
        mensajes_utiles=int(msg_pos),
        mensajes_no_utiles=int(msg_neg),
    )


# ---------- Claves de API ----------

@router.get("/api-keys", response_model=list[ApiKeyOut])
def listar_api_keys(db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    return db.execute(select(ApiKey).order_by(ApiKey.creada_en.desc())).scalars().all()


@router.post("/api-keys", response_model=ApiKeyOut, status_code=201)
def crear_api_key(
    payload: ApiKeyCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    key = ApiKey(nombre=payload.nombre, clave=payload.clave)
    db.add(key)
    db.commit()
    db.refresh(key)
    return key


@router.post("/api-keys/{key_id}/activar", response_model=ApiKeyOut)
def activar_api_key(
    key_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    key = db.get(ApiKey, key_id)
    if not key:
        raise HTTPException(status_code=404, detail="Clave no encontrada")

    # Desactivar todas
    from sqlalchemy import update
    db.execute(update(ApiKey).values(activa=False))
    db.commit() # Asegurar que se guarde el reset

    # Activar la seleccionada
    key.activa = True
    db.commit()
    db.refresh(key)

    # Actualizar .env
    try:
        # Intentar encontrar el .env en varias ubicaciones posibles
        posibles_rutas = [
            Path(".env"),
            Path("/app/.env"),
            Path(__file__).parent.parent.parent.parent / ".env"
        ]
        
        env_path = None
        for p in posibles_rutas:
            if p.exists():
                env_path = p
                break

        if env_path:
            set_key(str(env_path), "GOOGLE_API_KEY", key.clave)
            logger.info(f"Archivo .env actualizado en {env_path} con la clave: {key.nombre}")
        else:
            logger.warning("No se encontró el archivo .env en ninguna de las rutas probadas")

        # También actualizar en el proceso actual
        import os
        os.environ["GOOGLE_API_KEY"] = key.clave
        # Intentar actualizar settings si es posible
        try:
            settings.GOOGLE_API_KEY = key.clave
        except Exception:
            pass

    except Exception as e:
        logger.error(f"Error actualizando .env: {e}")

    return key


@router.delete("/api-keys/{key_id}", status_code=204)
def eliminar_api_key(
    key_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    key = db.get(ApiKey, key_id)
    if not key:
        raise HTTPException(status_code=404, detail="Clave no encontrada")

    if key.activa:
        raise HTTPException(status_code=400, detail="No se puede eliminar la clave que está en uso")

    db.delete(key)
    db.commit()
