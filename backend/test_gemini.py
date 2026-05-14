import os
import sys
from pathlib import Path

# Agregar el directorio raíz al path para importar app
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.services.llm import _get_gemini_model, build_user_prompt

def test_gemini():
    print(f"GOOGLE_API_KEY: {settings.GOOGLE_API_KEY[:10]}...")
    print(f"LLM_MODEL: {settings.LLM_MODEL}")
    
    model = _get_gemini_model()
    if model is None:
        print("❌ Error: No se pudo obtener el modelo de Gemini.")
        return

    prompt = build_user_prompt("¿Cuáles son los requisitos del comedor?", [{"texto": "Los requisitos son DNI y carnet.", "titulo": "Reglamento", "metadatos": {"pagina": 1}}])
    
    try:
        print("Enviando prompt a Gemini...")
        resp = model.generate_content(prompt)
        print("✅ Respuesta recibida:")
        print(resp.text)
    except Exception as e:
        print(f"❌ Error al generar contenido: {e}")

if __name__ == "__main__":
    test_gemini()
