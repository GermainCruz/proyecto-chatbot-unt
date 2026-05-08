from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.usuario import Sesion, Usuario
from app.schemas.auth import LoginIn, RefreshIn, RegistroIn, TokensOut, UsuarioOut


router = APIRouter(prefix="/auth", tags=["auth"])


def _emitir_tokens(db: Session, user: Usuario, request: Request) -> TokensOut:
    access = create_access_token(str(user.id_usuario), user.rol)
    refresh = create_refresh_token(str(user.id_usuario))
    db.add(
        Sesion(
            id_usuario=user.id_usuario,
            refresh_token=refresh,
            user_agent=request.headers.get("user-agent", "")[:300],
            ip=(request.client.host if request.client else None),
            expira_en=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
    )
    user.ultimo_acceso = datetime.now(timezone.utc)
    db.commit()
    return TokensOut(access_token=access, refresh_token=refresh)


@router.post("/registro", response_model=TokensOut, status_code=201)
def registro(payload: RegistroIn, request: Request, db: Session = Depends(get_db)):
    correo = payload.correo.lower()
    existente = db.execute(select(Usuario).where(Usuario.correo == correo)).scalar_one_or_none()
    if existente:
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese correo")

    user = Usuario(
        nombre_completo=payload.nombre_completo.strip(),
        correo=correo,
        contrasena_hash=hash_password(payload.password),
        rol="estudiante",
        correo_verificado=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _emitir_tokens(db, user, request)


@router.post("/login", response_model=TokensOut)
def login(payload: LoginIn, request: Request, db: Session = Depends(get_db)):
    user = db.execute(
        select(Usuario).where(Usuario.correo == payload.correo.lower())
    ).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.contrasena_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if not user.activo:
        raise HTTPException(status_code=403, detail="Usuario desactivado")
    return _emitir_tokens(db, user, request)


@router.post("/login-form", response_model=TokensOut, include_in_schema=False)
def login_form(
    request: Request,
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    return login(LoginIn(correo=form.username, password=form.password), request, db)


@router.post("/refresh", response_model=TokensOut)
def refresh(payload: RefreshIn, request: Request, db: Session = Depends(get_db)):
    try:
        data = decode_token(payload.refresh_token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Refresh token inválido")
    if data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Tipo de token incorrecto")

    sesion = db.execute(
        select(Sesion).where(Sesion.refresh_token == payload.refresh_token, Sesion.revocada.is_(False))
    ).scalar_one_or_none()
    if not sesion:
        raise HTTPException(status_code=401, detail="Sesión inválida o revocada")

    user = db.get(Usuario, int(data["sub"]))
    if not user or not user.activo:
        raise HTTPException(status_code=401, detail="Usuario inactivo")

    sesion.revocada = True
    db.commit()
    return _emitir_tokens(db, user, request)


@router.post("/logout", status_code=204)
def logout(payload: RefreshIn, db: Session = Depends(get_db)):
    sesion = db.execute(
        select(Sesion).where(Sesion.refresh_token == payload.refresh_token)
    ).scalar_one_or_none()
    if sesion:
        sesion.revocada = True
        db.commit()
    return None


@router.get("/me", response_model=UsuarioOut)
def me(user: Usuario = Depends(get_current_user)):
    return user
