from __future__ import annotations

import hashlib
import math

from openai import OpenAI

from app.core.config import settings


_client: OpenAI | None = None


def _get_client() -> OpenAI | None:
    global _client
    if not settings.OPENAI_API_KEY:
        return None
    if _client is None:
        _client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


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
    client = _get_client()
    if client is None:
        return [_fallback_embedding(t, settings.EMBEDDING_DIM) for t in texts]

    resp = client.embeddings.create(model=settings.EMBEDDING_MODEL, input=texts)
    return [d.embedding for d in resp.data]


def embed_text(text: str) -> list[float]:
    return embed_texts([text])[0]
