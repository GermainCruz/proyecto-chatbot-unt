"""Utilidades de limpieza de texto extraído de PDFs."""

from __future__ import annotations

import re


def limpiar_texto_ocr(texto: str) -> str:
    """Elimina basura común de OCR, encabezados repetidos y caracteres corruptos."""
    if not texto:
        return ""
    texto = re.sub(r"\(cid:\d+\)", "", texto)
    texto = re.sub(r"\n\s*\n", "\n", texto)
    texto = re.sub(r" {2,}", " ", texto)
    texto = re.sub(r"(?m)^\s*UNIVERSIDAD NACIONAL DE TRUJILLO\s*$", "", texto)
    texto = re.sub(r"(?m)^\s*UNIDAD DE BIENESTAR UNIVERSITARIO\s*$", "", texto)
    return texto.strip()
