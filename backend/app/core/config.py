from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


def _default_storage_dir() -> str:
    root = Path(__file__).resolve().parents[3]
    return str(root / "documentos")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "UNT Bot API"
    APP_ENV: str = "development"
    API_PREFIX: str = "/api"

    DATABASE_URL: str = "postgresql+psycopg://untbot:untbot@db:5432/untbot"

    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    ALLOWED_EMAIL_DOMAIN: str = "unitru.edu.pe"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    OPENAI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o-mini"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIM: int = 768

    CHUNK_SIZE: int = 900
    CHUNK_OVERLAP: int = 150
    TOP_K: int = 6
    SCORE_THRESHOLD: float = 0.45

    STORAGE_DIR: str = _default_storage_dir()
    MAX_PDF_MB: int = 25

    ADMIN_EMAIL: str = "admin@unitru.edu.pe"
    ADMIN_PASSWORD: str = "Admin1234*"
    ADMIN_NAME: str = "Administrador UNT Bot"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
