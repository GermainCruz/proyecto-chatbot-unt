from pathlib import Path

from app.core.config import settings


def project_root() -> Path:
    return Path(__file__).resolve().parents[3]


def resolve_storage_dir() -> Path:
    raw = Path(settings.STORAGE_DIR)
    if raw.is_absolute():
        return raw
    return (project_root() / raw).resolve()
