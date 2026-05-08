from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class FuenteOut(BaseModel):
    id_fragmento: int
    titulo: str
    pagina: int | None = None
    score: float


class MensajeOut(BaseModel):
    id_mensaje: int
    rol: str
    contenido: str
    fuentes: list[FuenteOut] | None = None
    util: int | None = None
    creado_en: datetime

    class Config:
        from_attributes = True


class ConversacionOut(BaseModel):
    id_conversacion: UUID
    titulo: str
    fijada: bool
    archivada: bool
    creada_en: datetime
    actualizada_en: datetime

    class Config:
        from_attributes = True


class ConversacionDetalleOut(ConversacionOut):
    mensajes: list[MensajeOut] = []


class NuevaConversacionIn(BaseModel):
    titulo: str | None = None


class PreguntaIn(BaseModel):
    pregunta: str = Field(min_length=1, max_length=2000)


class FeedbackIn(BaseModel):
    util: int = Field(ge=-1, le=1)


class RespuestaChatOut(BaseModel):
    id_mensaje_usuario: int
    id_mensaje_asistente: int
    contenido: str
    fuentes: list[FuenteOut]
    latencia_ms: int
