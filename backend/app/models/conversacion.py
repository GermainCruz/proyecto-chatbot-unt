from datetime import datetime
from uuid import UUID

from sqlalchemy import BigInteger, Boolean, DateTime, Enum, ForeignKey, Integer, SmallInteger, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


rol_mensaje_enum = Enum(
    "user",
    "assistant",
    "system",
    name="rol_mensaje",
    create_type=False,
    native_enum=True,
)


class Conversacion(Base):
    __tablename__ = "conversaciones"

    id_conversacion: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    id_usuario: Mapped[int] = mapped_column(BigInteger, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    titulo: Mapped[str] = mapped_column(String(200), default="Nueva conversación")
    fijada: Mapped[bool] = mapped_column(Boolean, default=False)
    archivada: Mapped[bool] = mapped_column(Boolean, default=False)
    creada_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizada_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    mensajes: Mapped[list["Mensaje"]] = relationship(
        back_populates="conversacion",
        cascade="all, delete-orphan",
        order_by="Mensaje.creado_en",
    )


class Mensaje(Base):
    __tablename__ = "mensajes"

    id_mensaje: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    id_conversacion: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("conversaciones.id_conversacion", ondelete="CASCADE"),
    )
    rol: Mapped[str] = mapped_column(rol_mensaje_enum, nullable=False)
    contenido: Mapped[str] = mapped_column(Text, nullable=False)
    fuentes: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    tokens_entrada: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tokens_salida: Mapped[int | None] = mapped_column(Integer, nullable=True)
    latencia_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    util: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversacion: Mapped[Conversacion] = relationship(back_populates="mensajes")
