import re

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.config import settings


class RegistroIn(BaseModel):
    nombre_completo: str = Field(min_length=3, max_length=150)
    correo: EmailStr
    password: str = Field(min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def validar_password(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("La contraseña debe incluir al menos una mayúscula")
        if not any(c.isdigit() for c in v):
            raise ValueError("La contraseña debe incluir al menos un número")
        return v

    @field_validator("correo")
    @classmethod
    def normalize_email(cls, v: str) -> str:
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
