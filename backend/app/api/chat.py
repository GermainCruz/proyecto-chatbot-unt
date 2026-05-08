from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.conversacion import Conversacion, Mensaje
from app.models.usuario import Usuario
from app.schemas.chat import (
    ConversacionDetalleOut,
    ConversacionOut,
    FeedbackIn,
    MensajeOut,
    NuevaConversacionIn,
    PreguntaIn,
    RespuestaChatOut,
)
from app.services.rag import responder_pregunta, titulo_para_conversacion


router = APIRouter(prefix="/chat", tags=["chat"])


def _check_owner(conv: Conversacion | None, user: Usuario) -> Conversacion:
    if conv is None or conv.id_usuario != user.id_usuario:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    return conv


@router.get("/conversaciones", response_model=list[ConversacionOut])
def listar_conversaciones(
    q: str | None = None,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    stmt = (
        select(Conversacion)
        .where(Conversacion.id_usuario == user.id_usuario)
        .order_by(desc(Conversacion.fijada), desc(Conversacion.actualizada_en))
    )
    if q:
        stmt = stmt.where(Conversacion.titulo.ilike(f"%{q}%"))
    return db.execute(stmt).scalars().all()


@router.post("/conversaciones", response_model=ConversacionOut, status_code=201)
def nueva_conversacion(
    payload: NuevaConversacionIn,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    conv = Conversacion(
        id_usuario=user.id_usuario,
        titulo=(payload.titulo or "Nueva conversación")[:200],
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.get("/conversaciones/{conv_id}", response_model=ConversacionDetalleOut)
def obtener_conversacion(
    conv_id: UUID,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    conv = _check_owner(db.get(Conversacion, conv_id), user)
    return conv


@router.delete("/conversaciones/{conv_id}", status_code=204)
def eliminar_conversacion(
    conv_id: UUID,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    conv = _check_owner(db.get(Conversacion, conv_id), user)
    db.delete(conv)
    db.commit()


@router.post("/conversaciones/{conv_id}/mensajes", response_model=RespuestaChatOut)
def enviar_mensaje(
    conv_id: UUID,
    payload: PreguntaIn,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    conv = _check_owner(db.get(Conversacion, conv_id), user)

    msg_user = Mensaje(
        id_conversacion=conv.id_conversacion,
        rol="user",
        contenido=payload.pregunta,
    )
    db.add(msg_user)
    db.commit()
    db.refresh(msg_user)

    if conv.titulo == "Nueva conversación":
        try:
            conv.titulo = titulo_para_conversacion(payload.pregunta)
            db.commit()
        except Exception:
            db.rollback()

    resultado = responder_pregunta(db, payload.pregunta)

    msg_asis = Mensaje(
        id_conversacion=conv.id_conversacion,
        rol="assistant",
        contenido=resultado["contenido"],
        fuentes=resultado["fuentes"],
        tokens_entrada=resultado["tokens_entrada"],
        tokens_salida=resultado["tokens_salida"],
        latencia_ms=resultado["latencia_ms"],
    )
    db.add(msg_asis)
    db.commit()
    db.refresh(msg_asis)

    return RespuestaChatOut(
        id_mensaje_usuario=msg_user.id_mensaje,
        id_mensaje_asistente=msg_asis.id_mensaje,
        contenido=resultado["contenido"],
        fuentes=resultado["fuentes"],
        latencia_ms=resultado["latencia_ms"],
    )


@router.post("/mensajes/{mensaje_id}/feedback", status_code=204)
def feedback_mensaje(
    mensaje_id: int,
    payload: FeedbackIn,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    msg = db.get(Mensaje, mensaje_id)
    if msg is None:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    conv = db.get(Conversacion, msg.id_conversacion)
    _check_owner(conv, user)
    msg.util = payload.util
    db.commit()
