"""Mejoras conversacionales: corrección de typos, intención y memoria de contexto."""
from __future__ import annotations

import re
from typing import Literal

Intent = Literal[
    "informacion",
    "procedimiento",
    "requisitos",
    "fechas",
    "ubicacion",
    "validacion",
    "saludo",
    "general",
]

# Errores frecuentes → término correcto (para búsqueda y sugerencia al usuario)
_CORRECCIONES: list[tuple[re.Pattern[str], str, str]] = [
    (re.compile(r"\bbinestar\b", re.I), "bienestar", "bienestar universitario"),
    (re.compile(r"\bvienestar\b", re.I), "bienestar", "bienestar universitario"),
    (re.compile(r"\bbieneztar\b", re.I), "bienestar", "bienestar universitario"),
    (re.compile(r"\bpronabek\b", re.I), "PRONABEC", "PRONABEC"),
    (re.compile(r"\bcomedor universitario\b", re.I), "comedor universitario", "comedor universitario"),
]

_INTENT_KEYWORDS: dict[Intent, list[str]] = {
    "saludo": [
        "hola", "buenos días", "buenos dias", "buenas tardes", "buenas noches",
        "hey", "hi", "saludos", "qué tal", "que tal", "buen día", "buen dia",
    ],
    "informacion": [
        "qué es", "que es", "qué significa", "que significa",
        "información sobre", "informacion sobre", "explícame", "explicame",
        "cuéntame", "cuentame", "define", "en qué consiste",
    ],
    "procedimiento": [
        "cómo postulo", "como postulo", "cómo me inscribo", "como me inscribo",
        "pasos para", "proceso de", "cómo aplico", "como aplico",
        "cómo me registro", "como me registro", "procedimiento",
    ],
    "requisitos": [
        "requisitos", "documentos", "qué necesito", "que necesito",
        "qué debo llevar", "que debo llevar", "papeles", "checklist",
        "lista de documentos", "qué papeles", "condiciones previas",
        "que condiciones", "condiciones"
    ],
    "fechas": [
        "hasta cuándo", "hasta cuando", "plazo", "fecha límite", "fecha limite",
        "cuándo cierra", "cuando cierra", "cuándo abre", "cuando abre",
        "calendario", "cronograma", "periodo de",
    ],
    "ubicacion": [
        "dónde entrego", "donde entrego", "dónde voy", "donde voy",
        "dirección", "direccion", "oficina", "lugar", "ubicación", "ubicacion",
        "secretaría", "secretaria", "horario de atención", "horario de atencion",
    ],
    "validacion": [
        "puedo postular", "califico", "cumplo", "soy elegible",
        "tengo derecho", "me aceptan", "pronabec", "promedio",
        "primer ciclo", "i ciclo", "1er ciclo", "primera vez",
        "me falta", "pierdo el comedor", "puedo otra vez",
    ],
}

_INSTRUCCIONES_POR_INTENCION: dict[Intent, str] = {
    "informacion": (
        "El estudiante busca información general. Explica de forma clara y cercana, "
        "como si le contaras a un compañero, no como un documento legal."
    ),
    "procedimiento": (
        "El estudiante quiere saber CÓMO hacer algo. Usa pasos numerados (1, 2, 3…) "
        "y termina indicando dónde realizar el trámite si el contexto lo menciona."
    ),
    "requisitos": (
        "El estudiante necesita saber qué documentos o requisitos cumplir. "
        "Presenta una lista con viñetas (✅ o -) para cada requisito. "
        "Al final ofrece: «Si quieres, puedo ayudarte a verificar si cumples los requisitos.»"
    ),
    "fechas": (
        "El estudiante pregunta por plazos u horarios. Lista solo fechas/horas en viñetas cortas. "
        "No incluyas requisitos ni trámites si no los pidieron."
    ),
    "ubicacion": (
        "El estudiante necesita saber DÓNDE ir. Incluye nombre del lugar, edificio u oficina "
        "y horarios si aparecen en el contexto."
    ),
    "validacion": (
        "El estudiante quiere saber si CALIFICA o qué le falta. "
        "Usa el historial de la conversación (ciclo, promedio, PRONABEC, etc.) si el estudiante ya lo mencionó. "
        "Si falta información clave, haz UNA pregunta concreta (ej: «¿Eres de primer ciclo?», «¿Tienes PRONABEC?»). "
        "Responde con claridad: «Sí calificas», «Te falta…» o «No cumples…» según el contexto."
    ),
    "saludo": (
        "El estudiante está saludando o iniciando la conversación. "
        "Responde de forma amable, preséntate como UNT Bot y pregunta en qué puedes ayudar."
    ),
    "general": (
        "Responde de forma útil y conversacional, priorizando lo que el estudiante necesita saber para actuar."
    ),
}


def normalizar_pregunta(pregunta: str) -> tuple[str, str | None]:
    """Corrige typos comunes. Devuelve (pregunta_normalizada, mensaje_sugerencia|None)."""
    texto = pregunta.strip()
    sugerencias: list[str] = []

    for patron, reemplazo, etiqueta in _CORRECCIONES:
        if patron.search(texto):
            texto = patron.sub(reemplazo, texto)
            if "bienestar" in reemplazo.lower() and etiqueta not in sugerencias:
                sugerencias.append(f"¿Te refieres a **{etiqueta}**?")

    mensaje = sugerencias[0] if sugerencias else None
    return texto, mensaje


def detectar_intencion(pregunta: str) -> Intent:
    """Clasificación heurística por palabras clave."""
    texto = pregunta.lower().strip()
    puntajes: dict[Intent, int] = {k: 0 for k in _INTENT_KEYWORDS}

    for intent, keywords in _INTENT_KEYWORDS.items():
        for kw in keywords:
            if kw in texto:
                puntajes[intent] += len(kw)

    mejor = max(puntajes, key=puntajes.get)  # type: ignore[arg-type]
    if puntajes[mejor] == 0:
        return "general"
    return mejor


def instrucciones_para_intencion(intent: Intent) -> str:
    return _INSTRUCCIONES_POR_INTENCION.get(intent, _INSTRUCCIONES_POR_INTENCION["general"])


def formatear_historial(
    mensajes: list[dict],
    max_turnos: int = 4,
) -> str:
    """Formatea los últimos mensajes para contexto multi-turno."""
    if not mensajes:
        return ""

    recientes = mensajes[-(max_turnos * 2) :]
    lineas: list[str] = []
    for m in recientes:
        rol = "Estudiante" if m.get("rol") == "user" else "Asistente"
        contenido = (m.get("contenido") or "").strip()
        if contenido:
            lineas.append(f"{rol}: {contenido[:500]}")

    if not lineas:
        return ""

    return "HISTORIAL RECIENTE DE LA CONVERSACIÓN:\n" + "\n".join(lineas)


def expandir_consulta(pregunta: str) -> str:
    """Expande la consulta con sinónimos para mejorar el recall."""
    from app.services.rag_filter import _normalizar, _SINONIMOS
    
    texto = _normalizar(pregunta)
    palabras = texto.split()
    nuevos_terminos = set(palabras)
    
    for palabra in palabras:
        for concepto, variantes in _SINONIMOS.items():
            if palabra in variantes:
                nuevos_terminos.add(concepto)
                # Añadir un par de variantes más si la palabra es corta (ej. gym -> gimnasio)
                for v in variantes[:2]:
                    nuevos_terminos.add(v)
    
    return " ".join(nuevos_terminos)
