"""Valida que las preguntas del chat pertenezcan al ámbito académico universitario."""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass


MENSAJE_FUERA_DE_ALCANCE = (
    "Gracias por tu mensaje. Soy QueryBot, asistente académico de la Universidad Nacional "
    "de Trujillo (UNT). Estoy diseñado para ayudarte con procesos universitarios —matrícula, "
    "trámites, sílabos, bienestar estudiantil y consultas basadas en los documentos oficiales "
    "cargados en el sistema—.\n\n"
    "No puedo responder preguntas ajenas a la vida académica universitaria (por ejemplo, "
    "historia general, entretenimiento, recetas u otros temas sin relación con la UNT). "
    "Si tienes una duda sobre un trámite o proceso de la universidad, con gusto te oriento."
)

_SALUDOS = {
    "hola",
    "buenos dias",
    "buenas tardes",
    "buenas noches",
    "buen dia",
    "gracias",
    "muchas gracias",
    "ok",
    "vale",
    "de acuerdo",
}

# Indicios claros de consulta universitaria / UNT
_PATRONES_ACADEMICOS = re.compile(
    r"\b("
    r"unt|universidad|facultad|escuela|matricula|matricular|inscripcion|inscribir|"
    r"tramite|tramites|silabo|silabos|curso|cursos|credito|creditos|ciclo|"
    r"semestre|horario|examen|nota|promedio|beca|becas|titulacion|egresado|"
    r"practicas|tesis|tupa|oficina|secretaria|decano|bienestar|comedor|"
    r"carnet|constancia|certificado|record|academico|plan de estudios|"
    r"vacante|admision|pregrado|posgrado|docente|alumno|estudiante|"
    r"reglamento|resolucion|cronograma|fecha limite|plazo|requisito|"
    r"matricula extemporanea|retiro de curso|convalidacion|equivalencia|"
    r"ura|comedor universitario|carne universitario|carnet universitario|"
    r"certificado de estudios|carpeta ura|postulacion al comedor"
    r")\b",
    re.IGNORECASE,
)

# Temas claramente fuera del alcance del asistente
_PATRONES_FUERA_DE_ALCANCE = re.compile(
    r"\b("
    r"revolucion industrial|segunda guerra mundial|primera guerra|tercera guerra|"
    r"imperio romano|edad media|renacimiento|futbol|messi|ronaldo|"
    r"receta de|como cocinar|pelicula|serie de netflix|tiktok|instagram|"
    r"bitcoin|criptomoneda|bolsa de valores|horoscopo|signo zodiacal|"
    r"quien gano el mundial|formula 1|videojuego|fortnite|minecraft|"
    r"chisme|farandula|celebridad|partido politico|elecciones presidenciales|"
    r"explicame acerca de la|cuentame sobre la historia de|"
    r"inteligencia artificial general|chatgpt vs|"
    r"clima en|tiempo en paris|capital de francia|capital de peru"
    r")\b",
    re.IGNORECASE,
)

_PREGUNTA_GENERAL_HISTORIA = re.compile(
    r"(explica|explicame|cuentame|hablame|que fue|que es|definicion de|"
    r"origen de|causas de|consecuencias de).{0,40}"
    r"(revolucion|imperio|guerra|dinastia|siglo\s+(xvi|xvii|xviii|xix|xx))",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class ResultadoAlcance:
    permitida: bool
    mensaje: str = ""


def _normalizar(texto: str) -> str:
    t = unicodedata.normalize("NFD", texto.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = re.sub(r"\s+", " ", t).strip()
    return t


def evaluar_alcance_academico(pregunta: str) -> ResultadoAlcance:
    texto = _normalizar(pregunta)
    if len(texto) < 2:
        return ResultadoAlcance(permitida=True)

    if texto in _SALUDOS or len(texto) <= 4:
        return ResultadoAlcance(permitida=True)

    tiene_academico = bool(_PATRONES_ACADEMICOS.search(texto))
    tiene_fuera = bool(_PATRONES_FUERA_DE_ALCANCE.search(texto))
    historia_general = bool(_PREGUNTA_GENERAL_HISTORIA.search(texto))

    if historia_general and not tiene_academico:
        return ResultadoAlcance(permitida=False, mensaje=MENSAJE_FUERA_DE_ALCANCE)

    if tiene_fuera and not tiene_academico:
        return ResultadoAlcance(permitida=False, mensaje=MENSAJE_FUERA_DE_ALCANCE)

    # Preguntas largas sin ningún vínculo universitario
    if len(texto.split()) >= 6 and not tiene_academico:
        if re.search(
            r"\b(por que|como|que es|quien fue|cuando|donde)\b",
            texto,
        ) and not re.search(r"\b(unt|universidad|estudiante|curso|tramite)\b", texto):
            if tiene_fuera or re.search(
                r"\b(historia|filosofia|literatura|biologia humana|astronomia|"
                r"geografia mundial|economia mundial|politica internacional)\b",
                texto,
            ):
                return ResultadoAlcance(permitida=False, mensaje=MENSAJE_FUERA_DE_ALCANCE)

    return ResultadoAlcance(permitida=True)
