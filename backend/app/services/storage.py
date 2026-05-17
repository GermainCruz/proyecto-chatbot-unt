"""Rutas y nombres de archivos PDF en la carpeta compartida del repositorio."""

from __future__ import annotations

import re
import unicodedata
from pathlib import Path
from uuid import uuid4

from app.core.config import settings


def project_root() -> Path:
    return Path(__file__).resolve().parents[3]


def resolve_storage_dir() -> Path:
    raw = Path(settings.STORAGE_DIR)
    if raw.is_absolute():
        return raw
    return (project_root() / raw).resolve()


def slugify(text: str, max_len: int = 80) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^\w\s-]", "", ascii_text).strip().lower()
    slug = re.sub(r"[\s_-]+", "-", slug)
    return (slug[:max_len] or "documento").strip("-")


def nombre_archivo_pdf(nombre_original: str | None, titulo: str) -> str:
    base = Path(nombre_original or f"{titulo}.pdf").stem
    stem = slugify(base or titulo)
    return f"{stem}_{uuid4().hex[:8]}.pdf"
