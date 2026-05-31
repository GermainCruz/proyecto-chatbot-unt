"""Filtrado y priorización de fragmentos RAG para reducir ruido e irrelevancia."""
from __future__ import annotations

import re
import unicodedata

_STOPWORDS = frozenset(
    """
    cual cuales como que del de la el los las un una unos unas en por para con sin
    soy es son esta este estos esas esa ser estar hay tiene tengo me te se al lo le
    les mi tu su sus ya o u y a the is are
    """.split()
)

_SINONIMOS: dict[str, list[str]] = {
    "gimnasio": ["gimnasio", "gym", "gymnasio", "deporte", "ejercicio", "entrenamiento", "pesas", "alfonso ugarte", "jirón trujillo"],
    "horario": ["horario", "horarios", "hora", "horas", "atiende", "apertura", "cierre", "turno", "cuando abre", "que hora", "mañana", "tarde"],
    "requisito": ["requisito", "requisitos", "documento", "documentos", "necesito", "papeles", "checklist", "que llevar", "estudiante vigente", "carné", "constancia", "condiciones", "previas"],
    "comedor": ["comedor", "alimentacion", "comida", "cafeteria", "almuerzo", "cena", "nutricion", "postulacion comedor", "comedor universitario", "ticket", "bandeja"],
    "matricula": ["matricula", "matricular", "inscripcion", "registro", "ingreso"],
    "silabo": ["silabo", "syllabus", "plan de estudios", "malla curricular", "cursos", "asignaturas", "malla"],
    "bienestar": ["bienestar", "social", "ayuda", "servicio social", "asistencia", "asistenta"],
}


def _normalizar(texto: str) -> str:
    """Lowercase, quitar tildes y caracteres especiales."""
    t = unicodedata.normalize("NFD", texto.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    # Quitar caracteres especiales pero mantener espacios, alfanuméricos y puntos de direcciones
    t = re.sub(r"[^a-z0-9\s\.]", "", t)
    return t.strip()


def extraer_terminos(pregunta: str) -> list[str]:
    raw = re.findall(r"[a-záéíóúñü0-9]{3,}", _normalizar(pregunta))
    terminos: list[str] = []
    for palabra in raw:
        if palabra in _STOPWORDS or palabra.isdigit():
            continue
        if palabra not in terminos:
            terminos.append(palabra)
        for grupo in _SINONIMOS.values():
            if palabra in grupo:
                for s in grupo:
                    if s not in terminos:
                        terminos.append(s)
    return terminos[:12]


def _pregunta_sobre_horarios(pregunta: str) -> bool:
    q = _normalizar(pregunta)
    return any(
        k in q
        for k in ("horario", "hora", "abre", "cierra", "atiende", "cuando abre", "que hora")
    )


def _pregunta_sobre_requisitos(pregunta: str) -> bool:
    q = _normalizar(pregunta)
    return any(k in q for k in ("requisito", "documento", "necesito", "papeles"))


def _temas_pregunta(pregunta: str) -> set[str]:
    q = _normalizar(pregunta)
    temas: set[str] = set()
    if any(w in q for w in ("gimnasio", "gym", "gymnasio")):
        temas.add("gimnasio")
    if "comedor" in q:
        temas.add("comedor")
    if "matricula" in q or "matricular" in q:
        temas.add("matricula")
    if "bienestar" in q:
        temas.add("bienestar")
    if any(w in q for w in ("silabo", "syllabus", "plan de estudios", "malla")):
        temas.add("silabo")
    return temas


def _tema_fragmento(texto: str, titulo: str) -> set[str]:
    t = f"{titulo} {texto}"
    n = _normalizar(t)
    temas: set[str] = set()
    if "gimnasio" in n or "gym" in n:
        temas.add("gimnasio")
    if "comedor" in n:
        temas.add("comedor")
    if "matricula" in n:
        temas.add("matricula")
    if "bienestar" in n:
        temas.add("bienestar")
    if "silabo" in n or "syllabus" in n or "plan de estudios" in n:
        temas.add("silabo")
    return temas


def puntaje_fragmento(pregunta: str, fragmento: dict) -> float:
    base = float(fragmento.get("score") or 0)
    texto = _normalizar(fragmento.get("texto") or "")
    titulo = _normalizar(fragmento.get("titulo") or "")
    terminos = extraer_terminos(pregunta)

    # Boost por términos exactos (Hybrid Search manual)
    boost = 0.0
    terminos_encontrados = 0
    for t in terminos:
        # Coincidencia exacta (Case insensitive gracias a _normalizar)
        if t in texto:
            boost += 0.12  # Incrementado de 0.08
            terminos_encontrados += 1
        if t in titulo:
            boost += 0.20  # Incrementado de 0.15
            terminos_encontrados += 1

    # Penalizar si no hay coincidencia de términos clave
    if terminos and terminos_encontrados == 0:
        boost -= 0.15  # Reducido de 0.25 para ser menos punitivo con términos cortos

    # Boost por coincidencia de tema
    temas_q = _temas_pregunta(pregunta)
    temas_f = _tema_fragmento(texto, titulo)
    if temas_q:
        if temas_q & temas_f:
            boost += 0.35 # Incrementado de 0.25
        else:
            # Penalización moderada si hay otros términos relevantes
            if terminos_encontrados > 1:
                boost -= 0.15
            else:
                boost -= 0.30 # Reducido de 0.40 para no descartar tan agresivamente

    if _pregunta_sobre_horarios(pregunta):
        tiene_horario = bool(
            re.search(r"\d{1,2}\s*:\s*\d{2}", texto)
            or any(k in texto for k in ("horario", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo", "turno"))
        )
        if tiene_horario:
            boost += 0.15
        else:
            boost -= 0.20

    if _pregunta_sobre_requisitos(pregunta):
        if any(k in texto for k in ("requisito", "documento", "necesito", "papeles")):
            boost += 0.15
        else:
            boost -= 0.10

    return round(base + boost, 4)


def seleccionar_fragmentos(
    pregunta: str,
    fragmentos: list[dict],
    *,
    max_para_llm: int,
    max_fuentes: int,
    min_rank: float,
) -> tuple[list[dict], list[dict]]:
    """Filtra, rankea y deduplica fragmentos para el LLM y la UI."""
    if not fragmentos:
        return [], []

    # 1. Re-ranking con lógica de negocio y hybrid boost
    rankeados = []
    textos_vistos = set()
    
    for f in fragmentos:
        # Deduplicación básica por contenido (evitar chunks casi idénticos)
        txt_norm = _normalizar(f.get("texto", "")[:100])
        if txt_norm in textos_vistos:
            continue
        textos_vistos.add(txt_norm)
        
        score_final = puntaje_fragmento(pregunta, f)
        rankeados.append({**f, "_rank": score_final})

    # 2. Filtrado estricto por umbral
    rankeados = [f for f in rankeados if f["_rank"] >= min_rank]
    rankeados.sort(key=lambda x: x["_rank"], reverse=True)

    if not rankeados:
        return [], []

    # 3. Selección para Fuentes UI (máximo uno por documento para evitar repetición)
    para_fuentes: list[dict] = []
    vistos_doc_fuentes: set[int] = set()
    for f in rankeados:
        did = f.get("id_documento")
        if did not in vistos_doc_fuentes:
            vistos_doc_fuentes.add(did)
            para_fuentes.append(f)
            if len(para_fuentes) >= max_fuentes:
                break

    # 4. Selección para LLM (máximo 3 fragmentos, priorizando diversidad de documentos)
    para_llm: list[dict] = []
    docs_en_llm: dict[int, int] = {}
    for f in rankeados:
        did = f.get("id_documento")
        count = docs_en_llm.get(did, 0)
        
        # Permitir hasta 2 fragmentos por documento si son muy relevantes, pero priorizar variedad
        if count < 2:
            para_llm.append(f)
            docs_en_llm[did] = count + 1
            if len(para_llm) >= max_para_llm:
                break

    return para_llm, para_fuentes
