"""Migraciones ligeras aplicadas al arrancar el backend (idempotentes)."""

from sqlalchemy import text
from sqlalchemy.orm import Session

from loguru import logger


def aplicar_migraciones(db: Session) -> None:
    db.execute(text("ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_correo_check"))
    db.commit()
    logger.info("Migraciones de esquema verificadas (registro con cualquier correo)")
