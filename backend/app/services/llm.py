from __future__ import annotations

import re
import google.generativeai as genai
from loguru import logger
from openai import OpenAI

from app.core.config import settings
from app.services.conversation import Intent, instrucciones_para_intencion
from app.services.embeddings import _is_usable_api_key
from app.services.formato_respuesta import normalizar_formato_respuesta
from app.services.respuesta_local import generar_respuesta_local
from app.services.text_clean import limpiar_texto_ocr


SYSTEM_PROMPT = """Eres "UNT Bot", el asistente inteligente oficial de la Universidad Nacional de Trujillo (UNT). Tu misión es ayudar a los estudiantes con respuestas humanas, claras y directas.

REGLAS DE ORO:
0. **Solo UNT**: Si la pregunta no es sobre procesos académicos o administrativos de la UNT, responde cordialmente que no estás diseñado para ese tipo de consultas (sin inventar datos).
1. **No Copiar Literal**: Está TERMINANTEMENTE PROHIBIDO copiar y pegar párrafos completos del PDF. Debes leer, interpretar y resumir la información.
2. **Formato Obligatorio**: Todas tus respuestas deben seguir estrictamente esta estructura:
   
   Respuesta:
   [Respuesta clara, resumida y directa a la pregunta del usuario]

   Detalles:
   • [Punto clave 1]
   • [Punto clave 2] (Usa viñetas para requisitos, pasos o datos importantes)

   Fuente:
   • [Nombre del documento oficial]

3. **Falta de Información**: Si los documentos (CONTEXTO OFICIAL) NO contienen la información específica solicitada (por ejemplo, preguntan un plazo exacto y no aparece), DEBES indicar explícitamente: "Disculpa, no cuento con esa información específica en los documentos actuales." ¡NUNCA inventes información, plazos, correos ni asumas datos!
4. **Limpieza**: Ignora cualquier texto que parezca basura de OCR, códigos extraños o encabezados institucionales repetitivos en el contexto.

TONO Y ESTILO:
- Habla como un asistente de soporte estudiantil amable y eficiente.
- Si hay requisitos o pasos, conviértelos SIEMPRE en una lista con viñetas (•).
- Si la información no existe, responde únicamente: "Disculpa, aún no cuento con información específica detallada sobre este tema en mis documentos actuales. Por favor, intenta reformular tu consulta con más contexto o contacta a la oficina correspondiente de la UNT."
"""


_openai_client: OpenAI | None = None
_gemini_models: dict[str, genai.GenerativeModel] = {}


def _get_openai_client() -> OpenAI | None:
    global _openai_client
    if not _is_usable_api_key(settings.OPENAI_API_KEY):
        return None
    if _openai_client is None:
        _openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _openai_client


def _get_gemini_model(model_name: str | None = None) -> genai.GenerativeModel | None:
    if not _is_usable_api_key(settings.GOOGLE_API_KEY):
        return None
    name = model_name or settings.LLM_MODEL
    if name not in _gemini_models:
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        _gemini_models[name] = genai.GenerativeModel(
            model_name=name,
            system_instruction=SYSTEM_PROMPT,
        )
    return _gemini_models[name]


def _texto_desde_respuesta_gemini(resp) -> str:
    try:
        if resp.text:
            return resp.text.strip()
    except Exception:
        pass
    partes: list[str] = []
    for cand in getattr(resp, "candidates", []) or []:
        content = getattr(cand, "content", None)
        if not content:
            continue
        for part in getattr(content, "parts", []) or []:
            t = getattr(part, "text", None)
            if t:
                partes.append(t)
    return "".join(partes).strip()


def _generation_config_gemini():
    return genai.types.GenerationConfig(
        temperature=0.3,
        max_output_tokens=settings.LLM_MAX_OUTPUT_TOKENS,
    )


def _es_error_cuota(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "429" in msg or "quota" in msg or "resourceexhausted" in msg


def _titulo_fuente(fragmentos: list[dict]) -> str | None:
    if not fragmentos:
        return None
    return (fragmentos[0].get("titulo") or "").strip() or None


def _formatear_salida(texto: str, fragmentos: list[dict]) -> str:
    return normalizar_formato_respuesta(texto, _titulo_fuente(fragmentos))


def _limpiar_respuesta_usuario(texto: str) -> str:
    """Quita restos técnicos que no deben verse en el chat."""
    # Reducimos la lista de palabras prohibidas para evitar falsos positivos
    prohibido = (
        "modo demo",
        "api_key",
        "llm_model",
        ".env",
    )
    lineas = []
    for linea in texto.splitlines():
        low = linea.lower()
        if any(p in low for p in prohibido):
            continue
        lineas.append(linea)
    return "\n".join(lineas).strip()


def build_user_prompt(
    pregunta: str,
    fragmentos: list[dict],
    *,
    historial: str = "",
    intent: Intent = "general",
    sugerencia_typo: str | None = None,
) -> str:
    if not fragmentos:
        contexto = "(Sin fragmentos relevantes)"
    else:
        bloques = []
        for i, f in enumerate(fragmentos, start=1):
            texto_limpio = limpiar_texto_ocr(f["texto"])
            bloques.append(f"DOCUMENTO: {f['titulo']}\nCONTENIDO: {texto_limpio}")
        contexto = "\n\n".join(bloques)

    partes = [
        f"CONTEXTO OFICIAL:\n{contexto}",
    ]
    if historial:
        partes.append(historial)
    partes.append(f"Intención: {intent}")
    partes.append(instrucciones_para_intencion(intent))
    if sugerencia_typo:
        partes.append(sugerencia_typo)
    partes.append(f"PREGUNTA DEL ESTUDIANTE:\n{pregunta}")
    partes.append(
        "Instrucción Final: Responde de forma humana y resumida siguiendo el formato 'Respuesta:', 'Detalles:' y 'Fuente:'. "
        "No menciones que estás leyendo un contexto. Si el usuario pregunta 'donde queda el gym', no respondas 'El gimnasio queda...', "
        "responde directamente 'El gimnasio de la UNT se ubica en...'."
    )
    return "\n\n".join(partes)


def _fallback_usuario(pregunta: str, fragmentos: list[dict], sugerencia_typo: str | None) -> str:
    local = generar_respuesta_local(pregunta, fragmentos)
    if local:
        if sugerencia_typo:
            return f"{sugerencia_typo}\n\n{local}"
        return local
    
    msg = "Disculpa, aún no cuento con información específica detallada sobre este tema en mis documentos actuales. Por favor, intenta reformular tu consulta con más contexto o contacta a la oficina correspondiente de la UNT."
    if sugerencia_typo:
        return f"{sugerencia_typo}\n\n{msg}"
    return msg


def _generar_con_gemini(user_prompt: str, model_name: str) -> tuple[str, int, int] | None:
    gemini = _get_gemini_model(model_name)
    if not gemini:
        return None
    try:
        resp = gemini.generate_content(
            user_prompt,
            generation_config=_generation_config_gemini(),
        )
        texto = _limpiar_respuesta_usuario(_texto_desde_respuesta_gemini(resp))
        if not texto:
            logger.warning(f"Gemini ({model_name}) devolvió respuesta vacía")
            return None
        usage = getattr(resp, "usage_metadata", None)
        return (
            texto,
            usage.prompt_token_count if usage else 0,
            usage.candidates_token_count if usage else 0,
        )
    except Exception as exc:
        logger.warning(f"Gemini ({model_name}) falló: {exc}")
        if _es_error_cuota(exc):
            raise
        return None


def generar_respuesta(
    pregunta: str,
    fragmentos: list[dict],
    *,
    historial: str = "",
    intent: Intent = "general",
    sugerencia_typo: str | None = None,
) -> tuple[str, int, int]:
    """Devuelve (texto, tokens_entrada, tokens_salida)."""
    # Priorizar saludo si la intención es saludo y la pregunta es corta
    if intent == "saludo" and len(pregunta.split()) <= 4:
        msg = (
            "¡Hola! Soy UNT Bot, tu asistente de la Universidad Nacional de Trujillo. "
            "¿En qué puedo ayudarte hoy con trámites, requisitos o servicios universitarios?"
        )
        if sugerencia_typo:
            msg = f"{sugerencia_typo}\n\n{msg}"
        return (msg, 0, 0)

    user_prompt = build_user_prompt(
        pregunta,
        fragmentos,
        historial=historial,
        intent=intent,
        sugerencia_typo=sugerencia_typo,
    )

    modelos_gemini = [settings.LLM_MODEL]
    if settings.LLM_MODEL_FALLBACK and settings.LLM_MODEL_FALLBACK not in modelos_gemini:
        modelos_gemini.append(settings.LLM_MODEL_FALLBACK)

    for modelo in modelos_gemini:
        try:
            resultado = _generar_con_gemini(user_prompt, modelo)
            if resultado:
                texto, t_in, t_out = resultado
                return (_formatear_salida(texto, fragmentos), t_in, t_out)
        except Exception as exc:
            if _es_error_cuota(exc):
                logger.warning(f"Cuota Gemini agotada ({modelo}); usando resumen local")
            continue

    openai_client = _get_openai_client()
    if openai_client:
        try:
            resp = openai_client.chat.completions.create(
                model=settings.LLM_MODEL,
                temperature=0.3,
                max_tokens=settings.LLM_MAX_OUTPUT_TOKENS,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
            )
            texto = _limpiar_respuesta_usuario(resp.choices[0].message.content or "")
            usage = resp.usage
            return (
                _formatear_salida(texto, fragmentos),
                (usage.prompt_tokens if usage else 0),
                (usage.completion_tokens if usage else 0),
            )
        except Exception as exc:
            logger.warning(f"OpenAI falló: {exc}")

    if not fragmentos:
        texto_lower = pregunta.lower().strip()
        if any(s in texto_lower for s in ("hola", "buenos", "buenas", "hey", "hi", "saludos")):
            msg = (
                "¡Hola! Soy QueryBot de la UNT. "
                "¿En qué puedo ayudarte con trámites, requisitos o servicios universitarios?"
            )
        else:
            msg = "Disculpa aun no cuento con informacion de este tema, pero proximanente estaremos actuliazando esta informacion 🙃"
        
        if sugerencia_typo:
            msg = f"{sugerencia_typo}\n\n{msg}"
        return (msg, 0, 0)

    fb = _fallback_usuario(pregunta, fragmentos, sugerencia_typo)
    return (_formatear_salida(fb, fragmentos), 0, 0)


def generar_titulo_conversacion(pregunta: str) -> str:
    """Genera un título corto basado en la primera pregunta."""
    base = pregunta.strip().split("\n")[0]

    for modelo in (settings.LLM_MODEL, settings.LLM_MODEL_FALLBACK):
        gemini = _get_gemini_model(modelo)
        if not gemini:
            continue
        try:
            prompt = (
                "Genera un título breve (máx 6 palabras) en español que resuma la siguiente "
                "pregunta de un estudiante UNT. Responde SOLO con el título, sin comillas.\n\n"
                f"Pregunta: {pregunta}"
            )
            resp = gemini.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=32,
                ),
            )
            titulo = _texto_desde_respuesta_gemini(resp).strip().strip('"').strip("'")
            if titulo:
                return titulo[:80]
        except Exception:
            continue

    openai_client = _get_openai_client()
    if openai_client:
        try:
            resp = openai_client.chat.completions.create(
                model=settings.LLM_MODEL,
                temperature=0.3,
                max_tokens=32,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Genera un título breve (máx 6 palabras) en español que resuma la siguiente "
                            "pregunta de un estudiante UNT. Responde SOLO con el título, sin comillas."
                        ),
                    },
                    {"role": "user", "content": pregunta},
                ],
            )
            titulo = (resp.choices[0].message.content or base).strip().strip('"').strip("'")
            return titulo[:80] or base[:60]
        except Exception:
            pass

    return base[:60] + ("…" if len(base) > 60 else "")
