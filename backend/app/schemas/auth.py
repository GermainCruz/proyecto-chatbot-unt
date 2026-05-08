import re

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.config import settings


class RegistroIn(BaseModel):
    nombre_completo: str = Field(min_length=3, max_length=150)
    correo: EmailStr
    password: str = Field(min_length=8, max_length=72)

    @field_validator("correo")
    @classmethod
    def validar_dominio(cls, v: str) -> str:
        domain = settings.ALLOWED_EMAIL_DOMAIN
        if not re.match(rf"^[a-zA-Z0-9._%+-]+@{re.escape(domain)}$", v):
            raise ValueError(f"El correo debe pertenecer al dominio @{domain}")
        return v.lower()


class LoginIn(BaseModel):
    correo: EmailStr
    password: str


class TokensOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UsuarioOut(BaseModel):
    id_usuario: int
    nombre_completo: str
    correo: str
    rol: str
    avatar_url: str | None = None
    activo: bool

    class Config:
        from_attributes = True


class RefreshIn(BaseModel):
    refresh_token: str
