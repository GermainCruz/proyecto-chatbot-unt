"""Respuesta resumida sin LLM (fallback cuando la API no está disponible)."""
from __future__ import annotations

import re

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
    terminos = [t for t in _normalizar(pregunta).split() if len(t) > 3]
    if not terminos:
        return []
        
    lineas_puntuadas: list[tuple[float, str]] = []
    for linea in texto.splitlines():
        l = linea.strip()
        if len(l) < 5 or len(l) > 500: # Umbrales más permisivos
            continue
        
        ln = _normalizar(l)
        # Contar cuántos términos de la pregunta aparecen en la línea
        coincidencias = sum(1 for t in terminos if t in ln)
        
        if coincidencias >= 1:
            # Dar más peso a líneas con más coincidencias
            score = coincidencias / len(terminos)
            # Boost si la línea parece un encabezado, ítem de lista o tiene números
            if l.startswith(("-", "•", "*", "1.", "2.", "3.")) or l.isupper() or re.search(r"\d", l):
                score += 0.3
            lineas_puntuadas.append((score, l))
    
    # Ordenar por relevancia y devolver las mejores
    lineas_puntuadas.sort(key=lambda x: x[0], reverse=True)
    return [l for s, l in lineas_puntuadas[:max_lineas]]


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


def generar_respuesta_local(pregunta: str, fragmentos: list[dict]) -> str | None:
    """Genera respuesta breve y humana sin LLM. None si no hay material útil."""
    if not fragmentos:
        return None

    # Limpiar fragmentos de basura OCR antes de procesar
    from app.services.llm import _limpiar_texto_ocr
    for f in fragmentos:
        f['texto'] = _limpiar_texto_ocr(f.get('texto', ''))

    fragmentos = _fragmentos_coherentes(pregunta, fragmentos)
    textos = [f.get("texto") or "" for f in fragmentos]
    combinado = "\n".join(textos)

    if _pregunta_sobre_horarios(pregunta):
        horarios = _extraer_horarios(combinado)
        if horarios:
            items = "\n".join(f"• {h}" for h in horarios[:8])
            return (
                "He encontrado la siguiente información sobre los **horarios** en los documentos oficiales:\n\n"
                f"{items}\n\n"
                "Para más detalles, puedes consultar la sección **Ver documentos oficiales**."
            )

    lineas = []
    for t in textos:
        lineas.extend(_lineas_relevantes(pregunta, t))
    
    # Deduplicación manteniendo orden
    vistos = set()
    lineas_unicas = []
    for l in lineas:
        l_norm = _normalizar(l)
        if l_norm not in vistos:
            vistos.add(l_norm)
            lineas_unicas.append(l)
            
    lineas = lineas_unicas[:10]

    if lineas:
        cuerpo = "\n".join(f"• {l[:250]}{'…' if len(l) > 250 else ''}" for l in lineas)
        return (
            "He encontrado los siguientes puntos relevantes en la documentación oficial:\n\n"
            f"{cuerpo}\n\n"
            "Si necesitas el detalle completo, puedes consultarlo en la sección **Ver documentos oficiales**."
        )

    # Si no hay líneas relevantes que contengan palabras clave de la pregunta,
    # no devolvemos un fragmento genérico para evitar respuestas fuera de contexto (ej. saludos).
    return None
