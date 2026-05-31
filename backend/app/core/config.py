from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # backend/.env primero; ../.env (raíz del proyecto) lo sobrescribe si existe
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    APP_NAME: str = "UNT Bot API"
    APP_ENV: str = "development"
    API_PREFIX: str = "/api"

    # En Docker Compose el servicio es "db"; en desarrollo local use localhost:5433 (ver docker-compose.yml)
    DATABASE_URL: str = "postgresql+psycopg://untbot:untbot@localhost:5433/untbot"

    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    ALLOWED_EMAIL_DOMAIN: str = "unitru.edu.pe"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"

    OPENAI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    LLM_MODEL: str = "gemini-2.0-flash"
    # Modelo alternativo si el principal agota cuota (429) en Gemini
    LLM_MODEL_FALLBACK: str = "gemini-2.0-flash"
    EMBEDDING_MODEL: str = "text-embedding-004"
    EMBEDDING_DIM: int = 768
    # Respuestas concisas (el detalle va en fuentes, no en el cuerpo)
    LLM_MAX_OUTPUT_TOKENS: int = 1024

    CHUNK_SIZE: int = 900
    CHUNK_OVERLAP: int = 150
    TOP_K: int = 20
    SCORE_THRESHOLD: float = 0.40
    RAG_MIN_RANK: float = 0.50
    RAG_MAX_FRAGMENTOS_LLM: int = 5
    RAG_MAX_FUENTES: int = 3

    STORAGE_DIR: str = "documentos"
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
