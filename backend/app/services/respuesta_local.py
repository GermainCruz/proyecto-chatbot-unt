"""Respuesta resumida sin LLM (fallback cuando la API no está disponible)."""
from __future__ import annotations

import re

from app.services.formato_respuesta import normalizar_formato_respuesta
from app.services.text_clean import limpiar_texto_ocr
from app.services.rag_filter import (
    _normalizar,
    _pregunta_sobre_horarios,
    _tema_fragmento,
    _temas_pregunta,
)

_RE_HORA = re.compile(
    r"(?i)(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|turno|ma[nñ]ana|tarde|noche)?"
    r"[^.\n]{0,80}?\d{1,2}\s*(:\s*\d{2})?\s*(AM|PM)?[^.\n]{0,40}"
)


def _lineas_relevantes(pregunta: str, texto: str, max_lineas: int = 12) -> list[str]:
    # Usar los primeros 6 caracteres de cada palabra larga para hacer un "stemming" rústico
    terminos = [t[:6] for t in _normalizar(pregunta).split() if len(t) > 3]
    if not terminos:
        return []

    lineas_puntuadas: list[tuple[float, str]] = []
    for linea in texto.splitlines():
        l = linea.strip()
        if len(l) < 5 or len(l) > 500:
            continue
        ln = _normalizar(l)
        coincidencias = sum(1 for t in terminos if t in ln)
        if coincidencias >= 1:
            score = coincidencias / len(terminos)
            if l.startswith(("-", "•", "*")) or re.match(r"^\d+[\.\)]", l) or l.isupper():
                score += 0.3
            lineas_puntuadas.append((score, l))

    lineas_puntuadas.sort(key=lambda x: x[0], reverse=True)
    return [l for _, l in lineas_puntuadas[:max_lineas]]


def _extraer_horarios(texto: str) -> list[str]:
    hallados: list[str] = []
    for linea in texto.splitlines():
        l = linea.strip()
        if _RE_HORA.search(l) or re.search(r"(?i)horario", l):
            if l not in hallados:
                hallados.append(l)
    return hallados[:10]


def _fragmentos_coherentes(pregunta: str, fragmentos: list[dict]) -> list[dict]:
    temas_q = _temas_pregunta(pregunta)
    if not temas_q:
        return fragmentos
    filtrados = [
        f
        for f in fragmentos
        if temas_q & _tema_fragmento(f.get("texto") or "", f.get("titulo") or "")
    ]
    return filtrados or fragmentos


def _respuesta_estructurada(
    resumen: str,
    puntos: list[str],
    titulo_fuente: str,
) -> str:
    detalles = "\n".join(f"- {p[:280]}{'…' if len(p) > 280 else ''}" for p in puntos[:8])
    texto = (
        f"**Respuesta:**\n{resumen}\n\n"
        f"**Detalles:**\n{detalles}\n\n"
        f"**Fuente:**\n- {titulo_fuente}"
    )
    return normalizar_formato_respuesta(texto, titulo_fuente)


def generar_respuesta_local(pregunta: str, fragmentos: list[dict]) -> str | None:
    """Genera respuesta breve y humana sin LLM. None si no hay material útil."""
    if not fragmentos:
        return None

    for f in fragmentos:
        f["texto"] = limpiar_texto_ocr(f.get("texto", ""))

    fragmentos = _fragmentos_coherentes(pregunta, fragmentos)
    textos = [f.get("texto") or "" for f in fragmentos]
    combinado = "\n".join(textos)
    titulo = (fragmentos[0].get("titulo") or "Documentación oficial UNT").strip()

    if _pregunta_sobre_horarios(pregunta):
        horarios = _extraer_horarios(combinado)
        if horarios:
            return _respuesta_estructurada(
                "Estos son los horarios que aparecen en los documentos oficiales:",
                horarios,
                titulo,
            )

    lineas: list[str] = []
    for t in textos:
        lineas.extend(_lineas_relevantes(pregunta, t))

    vistos: set[str] = set()
    lineas_unicas: list[str] = []
    for l in lineas:
        key = _normalizar(l)
        if key not in vistos:
            vistos.add(key)
            lineas_unicas.append(l)

    if not lineas_unicas:
        return None

    # Limitar las lineas mostradas para evitar un muro de texto
    lineas_finales = lineas_unicas[:6]
    resumen = (
        "Según la documentación oficial de la UNT, estos son los puntos principales "
        "relacionados con tu consulta:"
    )
    return _respuesta_estructurada(resumen, lineas_finales, titulo)
