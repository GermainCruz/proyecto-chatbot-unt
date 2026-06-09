"""Bloquea consultas ajenas a procesos académicos y administrativos de la UNT."""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass


MENSAJE_FUERA_DE_ALCANCE = (
    "Gracias por tu mensaje. Soy QueryBot, asistente de la Universidad Nacional de "
    "Trujillo (UNT). Estoy diseñado para orientarte en **procesos universitarios**: "
    "matrícula, trámites, bienestar, sílabos, comedor, carné URA, certificados y "
    "demás temas según los documentos oficiales cargados.\n\n"
    "No puedo responder consultas generales ajenas a la vida académica en la UNT "
    "(por ejemplo: salud mundial, historia, inventores, empresas de tecnología, "
    "entretenimiento u cultura general). Si tu duda es sobre un trámite o servicio "
    "universitario, con gusto te ayudo."
)

_SALUDOS = frozenset(
    {
        "hola",
        "buenos dias",
        "buenas tardes",
        "buenas noches",
        "buen dia",
        "hey",
        "hi",
        "saludos",
        "gracias",
        "muchas gracias",
        "ok",
        "vale",
    }
)

_PATRON_ACADEMICO = re.compile(
    r"\b("
    r"unt|universidad|facultad|escuela|matricula|matricular|inscripcion|"
    r"tramite|tramites|silabo|silabos|curso|cursos|credito|creditos|ciclo|"
    r"semestre|horario|examen|nota|beca|titulacion|practicas|tesis|"
    r"bienestar|comedor|gimnasio|gym|laboratorio|biblioteca|"
    r"carnet|carne universitario|ura|certificado de estudios|carpeta ura|"
    r"constancia|record academico|admision|vacante|docente|estudiante|"
    r"reglamento|tupa|oficina|secretaria|requisito|plazo|cronograma"
    r")\b",
    re.IGNORECASE,
)

_PATRON_FUERA = re.compile(
    r"\b("
    r"covid|coronavirus|pandemia|vacuna contra|"
    r"quien invento|quien creo|quien fundo|quien descubrio|"
    r"google|facebook|meta|apple|microsoft|amazon|netflix|tiktok|"
    r"revolucion industrial|segunda guerra|tercera guerra|imperio romano|"
    r"futbol|messi|ronaldo|mundial|formula 1|"
    r"receta de|como cocinar|pelicula|serie de|videojuego|fortnite|"
    r"bitcoin|criptomoneda|bolsa de valores|horoscopo|"
    r"capital de|presidente de|quien es el presidente|"
    r"inteligencia artificial general|chatgpt vs|openai vs|"
    r"que es el amor|significado de la vida"
    r")\b",
    re.IGNORECASE,
)

_PREGUNTA_GENERAL = re.compile(
    r"^\s*(que es|qué es|quien fue|quién fue|quien invento|quién invento|"
    r"quien creo|quién creó|cuentame sobre|cuéntame sobre|hablame de|háblame de|"
    r"explicame|explícame|definicion de|definición de)\b",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class ResultadoAlcance:
    permitida: bool
    mensaje: str = ""


def _normalizar(texto: str) -> str:
    t = unicodedata.normalize("NFD", texto.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", t).strip()


def evaluar_alcance_academico(pregunta: str) -> ResultadoAlcance:
    texto = _normalizar(pregunta)
    if len(texto) < 2:
        return ResultadoAlcance(permitida=True)
    if texto in _SALUDOS:
        return ResultadoAlcance(permitida=True)

    academico = bool(_PATRON_ACADEMICO.search(texto))
    fuera = bool(_PATRON_FUERA.search(texto))

    if fuera and not academico:
        return ResultadoAlcance(permitida=False, mensaje=MENSAJE_FUERA_DE_ALCANCE)

    if _PREGUNTA_GENERAL.search(texto) and not academico:
        return ResultadoAlcance(permitida=False, mensaje=MENSAJE_FUERA_DE_ALCANCE)

    if len(texto.split()) >= 5 and not academico:
        if re.search(
            r"\b(historia|filosofia|biologia|astronomia|geografia|economia|"
            r"politica|literatura|arte|musica|deporte)\b",
            texto,
        ):
            return ResultadoAlcance(permitida=False, mensaje=MENSAJE_FUERA_DE_ALCANCE)

    return ResultadoAlcance(permitida=True)
