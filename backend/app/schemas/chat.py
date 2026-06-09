from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, computed_field


class FuenteOut(BaseModel):
    id_fragmento: int
    titulo: str
    pagina: int | None = None
    score: float


class ContenidoEstructurado(BaseModel):
    respuesta: str = ""
    detalles: list[str] = []
    fuente: list[str] = []


class MensajeOut(BaseModel):
    id_mensaje: int
    rol: str
    contenido: str
    contenido_json: ContenidoEstructurado | None = None
    fuentes: list[FuenteOut] | None = None
    util: int | None = None
    creado_en: datetime

    @computed_field
    @property
    def respuesta(self) -> str | None:
        if self.contenido_json and self.contenido_json.respuesta.strip():
            return self.contenido_json.respuesta.strip()
        return None

    @computed_field
    @property
    def detalles(self) -> list[str]:
        if self.contenido_json:
            return [d for d in self.contenido_json.detalles if d.strip()]
        return []

    @computed_field
    @property
    def fuente(self) -> list[str]:
        if self.contenido_json:
            return [f for f in self.contenido_json.fuente if f.strip()]
        return []

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


class ActualizarConversacionIn(BaseModel):
    archivada: bool | None = None


class PreguntaIn(BaseModel):
    pregunta: str = Field(min_length=1, max_length=2000)
    id_categoria: int | None = None


class FeedbackIn(BaseModel):
    util: int = Field(ge=-1, le=1)


class TemaChatOut(BaseModel):
    id_categoria: int
    nombre: str
    descripcion: str | None = None
    icono: str | None = None
    documentos_count: int = 0


class DocumentoBaseOut(BaseModel):
    id_documento: int
    titulo: str
    estado: str
    categoria: str | None = None
    fragmentos_count: int = 0


class RespuestaChatOut(BaseModel):
    id_mensaje_usuario: int
    id_mensaje_asistente: int
    contenido: str
    contenido_json: ContenidoEstructurado | None = None
    respuesta: str | None = None
    detalles: list[str] = []
    fuente: list[str] = []
    fuentes: list[FuenteOut]
    latencia_ms: int
