"""Migraciones ligeras aplicadas al arrancar el backend (idempotentes)."""

from sqlalchemy import text
from sqlalchemy.orm import Session

from loguru import logger


def aplicar_migraciones(db: Session) -> None:
    db.execute(text("ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_correo_check"))
    
    db.execute(text("ALTER TABLE documentos ADD COLUMN IF NOT EXISTS palabras_clave TEXT"))
    
    try:
        db.execute(text("ALTER TYPE estado_documento ADD VALUE IF NOT EXISTS 'requiere_revision'"))
    except Exception:
        pass

    db.execute(
        text(
            """
            INSERT INTO categorias_documento (nombre, descripcion, icono)
            VALUES ('gym', 'Gym UNT', 'Dumbbell')
            ON CONFLICT (nombre) DO NOTHING
            """
        )
    )
        
    db.commit()
    logger.info("Migraciones de esquema verificadas (correo, palabras_clave, requiere_revision)")
