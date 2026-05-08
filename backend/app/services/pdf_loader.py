from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

import pdfplumber


@dataclass
class PDFChunk:
    texto: str
    pagina: int
    indice: int


def _limpiar(texto: str) -> str:
    texto = re.sub(r"[ \t]+", " ", texto)
    texto = re.sub(r"\n{3,}", "\n\n", texto)
    return texto.strip()


def extraer_texto_por_pagina(ruta_pdf: str | Path) -> list[tuple[int, str]]:
    """Devuelve lista de (n_pagina, texto) limpiando texto vacío."""
    paginas: list[tuple[int, str]] = []
    with pdfplumber.open(str(ruta_pdf)) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            texto = page.extract_text() or ""
            texto = _limpiar(texto)
            if texto:
                paginas.append((i, texto))
    return paginas


def _split_texto(texto: str, chunk_size: int, overlap: int) -> list[str]:
    """Splitter recursivo simple por separadores naturales."""
    separadores = ["\n\n", "\n", ". ", " "]

    def _split(t: str, sep_idx: int) -> list[str]:
        if len(t) <= chunk_size:
            return [t] if t.strip() else []
        if sep_idx >= len(separadores):
            return [t[i : i + chunk_size] for i in range(0, len(t), chunk_size - overlap)]
        sep = separadores[sep_idx]
        partes = t.split(sep)
        chunks: list[str] = []
        actual = ""
        for parte in partes:
            candidato = (actual + sep + parte) if actual else parte
            if len(candidato) <= chunk_size:
                actual = candidato
            else:
                if actual:
                    chunks.append(actual)
                if len(parte) > chunk_size:
                    chunks.extend(_split(parte, sep_idx + 1))
                    actual = ""
                else:
                    actual = parte
        if actual:
            chunks.append(actual)
        return [c.strip() for c in chunks if c.strip()]

    chunks = _split(texto, 0)

    if overlap > 0 and len(chunks) > 1:
        result: list[str] = []
        for i, chunk in enumerate(chunks):
            if i == 0:
                result.append(chunk)
            else:
                prev_tail = result[-1][-overlap:]
                result.append((prev_tail + " " + chunk).strip())
        return result
    return chunks


def chunkear_pdf(ruta_pdf: str | Path, chunk_size: int = 900, overlap: int = 150) -> list[PDFChunk]:
    paginas = extraer_texto_por_pagina(ruta_pdf)
    chunks: list[PDFChunk] = []
    indice = 0
    for n_pag, texto in paginas:
        for sub in _split_texto(texto, chunk_size, overlap):
            chunks.append(PDFChunk(texto=sub, pagina=n_pag, indice=indice))
            indice += 1
    return chunks
