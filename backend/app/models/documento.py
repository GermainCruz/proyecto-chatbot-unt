from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import BigInteger, Boolean, CHAR, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.config import settings
from app.core.database import Base


estado_documento_enum = Enum(
    "pendiente",
    "procesando",
    "indexado",
    "error",
    name="estado_documento",
    create_type=False,
    native_enum=True,
)


class CategoriaDocumento(Base):
    __tablename__ = "categorias_documento"

    id_categoria: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    icono: Mapped[str | None] = mapped_column(String(40), nullable=True)


class Documento(Base):
    __tablename__ = "documentos"

    id_documento: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    id_categoria: Mapped[int | None] = mapped_column(Integer, ForeignKey("categorias_documento.id_categoria"), nullable=True)
    titulo: Mapped[str] = mapped_column(String(300), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    formato: Mapped[str] = mapped_column(String(10), default="pdf", nullable=False)
    ruta_archivo: Mapped[str] = mapped_column(Text, nullable=False)
    hash_archivo: Mapped[str | None] = mapped_column(CHAR(64), unique=True, nullable=True)
    tamano_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    estado: Mapped[str] = mapped_column(estado_documento_enum, default="pendiente")
    error_mensaje: Mapped[str | None] = mapped_column(Text, nullable=True)
    subido_por: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("usuarios.id_usuario"), nullable=True)
    fecha_subida: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    fecha_indexado: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    categoria: Mapped[CategoriaDocumento | None] = relationship()
    fragmentos: Mapped[list["FragmentoDocumento"]] = relationship(
        back_populates="documento",
        cascade="all, delete-orphan",
    )


class FragmentoDocumento(Base):
    __tablename__ = "fragmentos_documentos"
    __table_args__ = (UniqueConstraint("id_documento", "indice_chunk"),)

    id_fragmento: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    id_documento: Mapped[int] = mapped_column(BigInteger, ForeignKey("documentos.id_documento", ondelete="CASCADE"))
    indice_chunk: Mapped[int] = mapped_column(Integer, nullable=False)
    texto: Mapped[str] = mapped_column(Text, nullable=False)
    tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(settings.EMBEDDING_DIM), nullable=True)
    metadatos: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    documento: Mapped[Documento] = relationship(back_populates="fragmentos")
