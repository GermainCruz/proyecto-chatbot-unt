"""Normaliza respuestas del chat a un formato legible (estilo asistente estructurado)."""

from __future__ import annotations

import re


_RE_BOILERPLATE_INICIO = re.compile(
    r"(?is)^\s*he encontrado (los siguientes puntos|la siguiente informacion)[^\n]*\n+",
)
_RE_BOILERPLATE_FIN = re.compile(
    r"(?is)\n+si necesitas el detalle completo[^\n]*ver documentos oficiales[^\n]*\.?\s*$",
)
_RE_SECCION = re.compile(r"(?im)^\s*(\*\*)?\s*(respuesta|detalles|fuente)\s*(\*\*)?\s*:\s*$")
_RE_SECCION_INLINE = re.compile(
    r"(?im)^\s*(\*\*)?\s*(respuesta|detalles|fuente)\s*(\*\*)?\s*:\s*(.+)$"
)


def _limpiar_item(linea: str) -> str:
    linea = linea.strip()
    linea = re.sub(r"^[•\-\*]\s*", "", linea)
    linea = re.sub(r"\s*•\s*", " — ", linea)
    return re.sub(r"\s{2,}", " ", linea).strip()


def _items_desde_linea(linea: str) -> list[str]:
    if "•" in linea:
        return [p.strip() for p in re.split(r"\s*•\s*", linea.strip()) if p.strip()]
    m = re.match(r"^\s*[\-\*•]\s*(.+)$", linea.strip())
    if m:
        return [m.group(1).strip()]
    return [linea.strip()] if linea.strip() else []


def _arreglar_listas(texto: str) -> str:
    salida: list[str] = []
    for linea in texto.splitlines():
        if not linea.strip():
            salida.append("")
            continue
        if re.match(r"^\s*[\-\*•]\s*$", linea):
            continue
        if _RE_SECCION.match(linea):
            s = _RE_SECCION.sub(lambda m: f"**{m.group(2).capitalize()}:**", linea.strip())
            salida.append(s)
            continue
        m_inline = _RE_SECCION_INLINE.match(linea)
        if m_inline:
            salida.append(f"**{m_inline.group(2).capitalize()}:**")
            resto = m_inline.group(4).strip()
            if resto:
                items = _items_desde_linea(resto)
                if len(items) <= 1:
                    limpio = _limpiar_item(resto)
                    if limpio:
                        salida.append(limpio)
                else:
                    for it in items:
                        limpio = _limpiar_item(it)
                        if limpio:
                            salida.append(f"- {limpio}")
            continue
        items = _items_desde_linea(linea)
        if len(items) <= 1:
            limpio = _limpiar_item(items[0]) if items else ""
            if limpio:
                salida.append(limpio)
        else:
            for it in items:
                limpio = _limpiar_item(it)
                if limpio:
                    salida.append(f"- {limpio}")
    return "\n".join(salida)


def normalizar_formato_respuesta(texto: str, titulo_fuente: str | None = None) -> str:
    if not texto or not texto.strip():
        return texto

    t = texto.strip()
    t = _RE_BOILERPLATE_INICIO.sub("", t)
    t = _RE_BOILERPLATE_FIN.sub("", t).strip()

    # Si es el mensaje de fallback por defecto, evitar formato de lista duplicado
    if "no cuento con información específica" in t.lower() or "no cuento con documentos" in t.lower():
        if titulo_fuente:
            return f"**Respuesta:**\n{t}\n\n**Fuente:**\n- {titulo_fuente}"
        return f"**Respuesta:**\n{t}"

    if re.search(r"(?im)^\s*(\*\*)?\s*respuesta\s*(\*\*)?\s*:", t):
        return _arreglar_listas(t)

    lineas_utiles: list[str] = []
    for linea in t.splitlines():
        for item in _items_desde_linea(linea):
            limpio = _limpiar_item(item)
            if len(limpio) >= 8:
                lineas_utiles.append(limpio)

    if not lineas_utiles:
        return _arreglar_listas(t) if t else texto

    # Evitar crear resumenes y detalles si solo hay 1 o 2 lineas sin sentido de lista
    if len(lineas_utiles) <= 1:
        resumen = lineas_utiles[0]
        if titulo_fuente:
            return f"**Respuesta:**\n{resumen}\n\n**Fuente:**\n- {titulo_fuente}"
        return f"**Respuesta:**\n{resumen}"

    resumen = lineas_utiles[0]
    if len(resumen) > 220:
        resumen = resumen[:217].rsplit(" ", 1)[0] + "…"

    detalles = "\n".join(f"- {l}" for l in lineas_utiles[:8])
    bloques = [f"**Respuesta:**\n{resumen}", f"**Detalles:**\n{detalles}"]
    fuente = titulo_fuente or "Documentación oficial UNT"
    bloques.append(f"**Fuente:**\n- {fuente}")
    return "\n\n".join(bloques)
