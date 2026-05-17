from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from sqlalchemy import select

from app.api import admin as admin_router
from app.api import auth as auth_router
from app.api import chat as chat_router
from app.core.categorias_seed import sincronizar_categorias_documento
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password, verify_password
from app.models.usuario import Usuario


def _ensure_categorias() -> None:
    db = SessionLocal()
    try:
        sincronizar_categorias_documento(db)
        logger.info("Categorías de documentos sincronizadas")
    except Exception as exc:
        logger.error(f"No se pudieron sincronizar categorías: {exc}")
        db.rollback()
    finally:
        db.close()


def _ensure_admin() -> None:
    db = SessionLocal()
    try:
        existente = db.execute(
            select(Usuario).where(Usuario.correo == settings.ADMIN_EMAIL.lower())
        ).scalar_one_or_none()
        if existente:
            changed = False
            if existente.rol != "administrador":
                existente.rol = "administrador"
                changed = True
            if not verify_password(settings.ADMIN_PASSWORD, existente.contrasena_hash):
                existente.contrasena_hash = hash_password(settings.ADMIN_PASSWORD)
                changed = True
                logger.info(f"Contraseña de admin sincronizada: {existente.correo}")
            if changed:
                db.commit()
            logger.info(f"Administrador presente: {existente.correo}")
            return
        admin = Usuario(
            nombre_completo=settings.ADMIN_NAME,
            correo=settings.ADMIN_EMAIL.lower(),
            contrasena_hash=hash_password(settings.ADMIN_PASSWORD),
            rol="administrador",
            correo_verificado=True,
        )
        db.add(admin)
        db.commit()
        logger.info(f"Administrador creado: {admin.correo}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    _ensure_categorias()
    try:
        _ensure_admin()
    except Exception as exc:
        logger.error(f"No se pudo crear/verificar admin inicial: {exc}")
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}


app.include_router(auth_router.router, prefix=settings.API_PREFIX)
app.include_router(chat_router.router, prefix=settings.API_PREFIX)
app.include_router(admin_router.router, prefix=settings.API_PREFIX)
