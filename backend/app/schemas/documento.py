from datetime import datetime

from pydantic import BaseModel


class CategoriaOut(BaseModel):
    id_categoria: int
    nombre: str
    descripcion: str | None = None
    icono: str | None = None

    class Config:
        from_attributes = True


class DocumentoOut(BaseModel):
    id_documento: int
    titulo: str
    descripcion: str | None = None
    formato: str
    estado: str
    error_mensaje: str | None = None
    tamano_bytes: int | None = None
    fecha_subida: datetime
    fecha_indexado: datetime | None = None
    categoria: CategoriaOut | None = None
    activo: bool
    fragmentos_count: int = 0

    class Config:
        from_attributes = True


class UsuarioAdminOut(BaseModel):
    id_usuario: int
    nombre_completo: str
    correo: str
    rol: str
    activo: bool
    fecha_registro: datetime
    ultimo_acceso: datetime | None = None

    class Config:
        from_attributes = True


class UsuarioUpdateIn(BaseModel):
    rol: str | None = None
    activo: bool | None = None


class MetricasOut(BaseModel):
    total_usuarios: int
    total_estudiantes: int
    total_admins: int
    total_documentos: int
    documentos_indexados: int
    total_fragmentos: int
    total_conversaciones: int
    total_mensajes: int
    mensajes_utiles: int
    mensajes_no_utiles: int
