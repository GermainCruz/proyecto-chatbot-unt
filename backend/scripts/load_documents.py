"""
Carga masiva de PDFs desde un directorio local.

Uso (dentro del contenedor backend):
    docker compose exec backend python -m scripts.load_documents /ruta/a/carpeta

O en local (con el venv activo y la BD accesible):
    python -m scripts.load_documents ./pdfs
"""
from __future__ import annotations

import hashlib
import sys
from pathlib import Path
from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import SessionLocal  # noqa: E402
from app.models.documento import Documento  # noqa: E402
from app.services.rag import indexar_documento  # noqa: E402
from app.services.storage import nombre_archivo_pdf, resolve_storage_dir  # noqa: E402


def main(carpeta: str) -> None:
    src = Path(carpeta)
    if not src.exists() or not src.is_dir():
        print(f"❌ No existe la carpeta: {src}")
        sys.exit(1)

    pdfs = list(src.glob("**/*.pdf"))
    if not pdfs:
        print("⚠️  No se encontraron PDFs en la carpeta.")
        return

    storage = resolve_storage_dir()
    storage.mkdir(parents=True, exist_ok=True)

    db = SessionLocal()
    try:
        for pdf in pdfs:
            print(f"\n📄 Procesando: {pdf.name}")
            data = pdf.read_bytes()
            sha = hashlib.sha256(data).hexdigest()

            existente = db.execute(
                select(Documento).where(Documento.hash_archivo == sha)
            ).scalar_one_or_none()
            if existente:
                print(f"   ↪ Ya existe en BD (id={existente.id_documento}), reindexando…")
                doc = existente
            else:
                destino = storage / nombre_archivo_pdf(pdf.name, pdf.stem.replace("_", " "))
                destino.write_bytes(data)
                doc = Documento(
                    titulo=pdf.stem.replace("_", " ")[:300],
                    formato="pdf",
                    ruta_archivo=str(destino),
                    hash_archivo=sha,
                    tamano_bytes=len(data),
                    estado="pendiente",
                )
                db.add(doc)
                db.commit()
                db.refresh(doc)

            n, err = indexar_documento(db, doc)
            if err:
                print(f"   ❌ Error: {err}")
            else:
                print(f"   ✅ {n} fragmentos indexados.")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python -m scripts.load_documents <carpeta_con_pdfs>")
        sys.exit(1)
    main(sys.argv[1])
