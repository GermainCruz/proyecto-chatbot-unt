from __future__ import annotations

import hashlib
import math
import google.generativeai as genai
from openai import OpenAI

from app.core.config import settings


_openai_client: OpenAI | None = None


def _get_openai_client() -> OpenAI | None:
    global _openai_client
    if not settings.OPENAI_API_KEY:
        return None
    if _openai_client is None:
        _openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _openai_client


def _get_gemini_embeddings(texts: list[str]) -> list[list[float]] | None:
    if not settings.GOOGLE_API_KEY:
        return None
    try:
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        result = genai.embed_content(
            model=settings.EMBEDDING_MODEL,
            content=texts,
            task_type="retrieval_document",
            output_dimensionality=settings.EMBEDDING_DIM
        )
        return result['embedding']
    except Exception:
        return None


def _fallback_embedding(text: str, dim: int) -> list[float]:
    """Embedding determinista para entornos sin OPENAI_API_KEY.

    Solo permite indexar y consultar como prueba; la calidad RAG con OpenAI
    es muy superior. Genera un vector pseudoaleatorio basado en hash MD5
    del texto y luego lo normaliza (norma L2 = 1).
    """
    seed = hashlib.md5(text.encode("utf-8")).digest()
    values: list[float] = []
    i = 0
    while len(values) < dim:
        chunk = seed[i % len(seed):i % len(seed) + 4] or seed[:4]
        n = int.from_bytes((chunk + seed)[:4], "big", signed=False)
        values.append(((n % 20000) - 10000) / 10000.0)
        i += 4
    norm = math.sqrt(sum(v * v for v in values)) or 1.0
    return [v / norm for v in values[:dim]]


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []

    # 1. Intentar con Gemini
    gemini_embeddings = _get_gemini_embeddings(texts)
    if gemini_embeddings is not None:
        return gemini_embeddings

    # 2. Intentar con OpenAI
    openai_client = _get_openai_client()
    if openai_client is not None:
        resp = openai_client.embeddings.create(model=settings.EMBEDDING_MODEL, input=texts)
        return [d.embedding for d in resp.data]

    # 3. Fallback
    return [_fallback_embedding(t, settings.EMBEDDING_DIM) for t in texts]


def embed_text(text: str) -> list[float]:
    return embed_texts([text])[0]
