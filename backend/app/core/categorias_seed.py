"""Categorías de documentos que se sincronizan al iniciar el backend (idempotente)."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.documento import CategoriaDocumento

# (nombre interno, descripción visible, icono lucide)
CATEGORIAS_DOCUMENTO: list[tuple[str, str, str]] = [
    ("silabo", "Sílabos y currículas", "BookOpen"),
    ("matricula", "Procesos de matrícula", "ClipboardList"),
    ("bienestar", "Bienestar universitario, gimnasio y comedor", "Heart"),
    ("tramites", "Trámites académicos y administrativos", "FileText"),
    ("biblioteca", "Biblioteca y préstamo de libros", "Library"),
    ("laboratorios", "Ubicación y reserva de laboratorios", "FlaskConical"),
    ("practicas", "Prácticas preprofesionales", "Briefcase"),
    ("idiomas", "Inglés y otros idiomas", "Languages"),
    ("cocurriculares", "Cursos co-curriculares", "Award"),
    ("general", "Otros temas", "HelpCircle"),
    ("comedor_universitario", "Postulación al comedor universitario", "Utensils"),
    ("carne_universitario_ura", "Solicitud de carné universitario (URA)", "IdCard"),
    ("certificado_estudios_ura", "Obtención de certificado de estudios (URA)", "FileCheck"),
    ("carpeta_ura", "Elaboración de carpeta (URA)", "FolderOpen"),
]


def sincronizar_categorias_documento(db: Session) -> None:
    for nombre, descripcion, icono in CATEGORIAS_DOCUMENTO:
        cat = db.execute(
            select(CategoriaDocumento).where(CategoriaDocumento.nombre == nombre)
        ).scalar_one_or_none()
        if cat is None:
            db.add(
                CategoriaDocumento(
                    nombre=nombre,
                    descripcion=descripcion,
                    icono=icono,
                )
            )
        else:
            cat.descripcion = descripcion
            cat.icono = icono
    db.commit()
