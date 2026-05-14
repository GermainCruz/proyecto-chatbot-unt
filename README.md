# 🎓 UNT Bot — Asistente RAG Universidad Nacional de Trujillo

Chatbot educativo basado en **RAG (Retrieval-Augmented Generation)** para resolver dudas frecuentes de los estudiantes de la UNT a partir de documentos oficiales subidos por administradores.

## ✨ Características

- **Dos roles**: estudiante y administrador.
- **Registro restringido** al dominio `@unitru.edu.pe`.
- **Chat estilo Claude** con sidebar, historial buscable, audio (Web Speech API), feedback útil/no útil y citas a fuentes.
- **Panel admin** con dashboard de métricas, carga de PDFs (drag & drop) e indexado vectorial automático en background, gestión de usuarios y roles.
- **Arquitectura RAG** con `pgvector` (HNSW), embeddings de OpenAI y LLM `gpt-4o-mini` (configurable).
- **Modo demo** sin OpenAI: la app sigue funcional con respuestas heurísticas para pruebas locales.
- 100% **dockerizado** — un solo comando para levantar todo.

## 🧱 Stack

| Capa            | Tecnología                                         |
|-----------------|----------------------------------------------------|
| Frontend        | Next.js 14 (App Router) · Tailwind CSS · TypeScript |
| Backend         | FastAPI · Python 3.11 · SQLAlchemy 2 · Pydantic v2 |
| Base de datos   | PostgreSQL 16 + `pgvector` + `pg_trgm`             |
| LLM / Embeddings| OpenAI (`gpt-4o-mini`, `text-embedding-3-small`)   |
| Auth            | JWT (access + refresh) · bcrypt                    |
| PDF             | `pdfplumber` (extracción) + chunker recursivo      |
| Orquestación    | Docker Compose                                     |

## 🗂️ Estructura

```
proyecto-chatbot-unt/
├── backend/                # FastAPI + servicios RAG
│   ├── app/
│   │   ├── api/            # Routers: auth, chat, admin
│   │   ├── core/           # config, db, security, deps
│   │   ├── models/         # SQLAlchemy ORM
│   │   ├── schemas/        # Pydantic
│   │   ├── services/       # rag, embeddings, llm, pdf_loader
│   │   └── main.py
│   ├── scripts/            # CLI para carga masiva de PDFs
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # Next.js 14
│   ├── src/
│   │   ├── app/            # Rutas: /, /login, /registro, /chat, /admin/*
│   │   ├── components/     # Sidebar, MensajeBurbuja, CajaPregunta, ...
│   │   ├── lib/            # api client, auth-context
│   │   └── styles/
│   ├── Dockerfile
│   └── package.json
├── database/
│   ├── init.sql            # Esquema completo (usuarios, chat, RAG)
│   └── seed_data.sql       # Categorías iniciales
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🚀 Inicio rápido (Docker)

**Requisitos**: Docker Desktop + Docker Compose v2.

```bash
# 1. Clonar y entrar al proyecto
cd proyecto-chatbot-unt

# 2. Crear el archivo .env desde la plantilla
cp .env.example .env       # (en Windows PowerShell: copy .env.example .env)

# 3. Editar .env y colocar al menos:
#    - JWT_SECRET (clave aleatoria larga)
#    - OPENAI_API_KEY  (opcional para modo demo)

# 4. Levantar todo
docker compose up --build
```

Servicios disponibles:

| Servicio  | URL                                    |
|-----------|----------------------------------------|
| Frontend  | http://localhost:3000                  |
| Backend   | http://localhost:8000                  |
| API docs  | http://localhost:8000/docs             |
| PostgreSQL| `localhost:5432` (user/pass `untbot`)  |

### 👤 Usuario administrador inicial

Se crea automáticamente al iniciar el backend con los valores de `.env`:

- **Correo**: `admin@unitru.edu.pe`
- **Contraseña**: `Admin1234*`

> Cambia estas credenciales en `.env` antes del primer arranque o desde el panel admin después.

## 🧪 Flujo de uso

1. Ingresa como **administrador** en `/login`.
2. Ve a **Panel admin → Documentos** y sube uno o más PDFs oficiales (sílabos, reglamentos, guías…). El sistema los indexa automáticamente (estado pasa de `pendiente` → `procesando` → `indexado`).
3. Cierra sesión y **regístrate como estudiante** con un correo `@unitru.edu.pe`.
4. Haz preguntas en el chat. UNT Bot recupera fragmentos relevantes y responde citando las fuentes.

## 🛠️ Comandos para arrancar el app (desarrollo local)

Si prefieres ejecutar frontend y backend por separado sin Docker:

### Backend (FastAPI)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # En Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

### Carga masiva por CLI (opcional)

```bash
docker compose exec backend python -m scripts.load_documents /ruta/dentro/del/contenedor
```

## 🔌 Endpoints principales

| Método | Ruta                                              | Descripción                              |
|--------|---------------------------------------------------|------------------------------------------|
| POST   | `/api/auth/registro`                              | Registro (solo `@unitru.edu.pe`)         |
| POST   | `/api/auth/login`                                 | Login                                    |
| POST   | `/api/auth/refresh`                               | Renovar tokens                           |
| GET    | `/api/auth/me`                                    | Usuario actual                           |
| GET    | `/api/chat/conversaciones`                        | Listar conversaciones del usuario        |
| POST   | `/api/chat/conversaciones`                        | Crear conversación                       |
| GET    | `/api/chat/conversaciones/{id}`                   | Detalle con mensajes                     |
| POST   | `/api/chat/conversaciones/{id}/mensajes`          | Enviar pregunta y recibir respuesta RAG  |
| POST   | `/api/chat/mensajes/{id}/feedback`                | Marcar útil / no útil                    |
| GET    | `/api/admin/metricas`                             | Métricas globales                        |
| GET    | `/api/admin/categorias`                           | Categorías de documentos                 |
| GET    | `/api/admin/documentos`                           | Listar documentos                        |
| POST   | `/api/admin/documentos` (multipart)               | Subir PDF                                |
| POST   | `/api/admin/documentos/{id}/reprocesar`           | Reindexar                                |
| DELETE | `/api/admin/documentos/{id}`                      | Eliminar                                 |
| GET    | `/api/admin/usuarios`                             | Listar usuarios                          |
| PATCH  | `/api/admin/usuarios/{id}`                        | Cambiar rol / activar / desactivar       |

## 🎨 Paleta UNT

| Token             | Hex      | Uso                              |
|-------------------|----------|----------------------------------|
| `unt-blue-900`    | #0A2A5E  | Fondo header, sidebar oscuro     |
| `unt-blue-700`    | #103E86  | Primario (botones, links)        |
| `unt-blue-500`    | #1E5BB8  | Hover, acentos                   |
| `unt-gold-600`    | #B8860B  | CTA "Nuevo chat"                 |
| `unt-gold-400`    | #E0B341  | Hover dorado, decoraciones       |
| `unt-gold-100`    | #FBEFCB  | Fondos cálidos                   |

## 🧠 Pipeline RAG

```
Pregunta del estudiante
   │
   ▼
embed_text() ──────────────► OpenAI text-embedding-3-small (1536d)
   │
   ▼
SELECT ... ORDER BY embedding <=> :emb     (HNSW + cosine)
   │
   ▼
top_k fragmentos con score ≥ 0.45
   │
   ▼
LLM (gpt-4o-mini) con system prompt anti-alucinación
   │
   ▼
Respuesta + citas guardadas en BD + fuentes mostradas en UI
```

Si el mejor score es bajo o no hay fragmentos, el bot responde con la fórmula:
> *"No cuento con información oficial sobre eso. Te sugiero contactar a la oficina correspondiente de la UNT."*

## 🛡️ Seguridad

- Validación del dominio `@unitru.edu.pe` en frontend, backend y BD (`CHECK`).
- Hashing de contraseñas con **bcrypt**.
- JWT access (60 min) + refresh (7 días) con rotación.
- CORS restringido al frontend declarado en `.env`.
- Validación de tamaño y tipo de PDF (máx. 25 MB).
- Detección de duplicados por SHA-256.

## 🧩 Desarrollo local sin Docker

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate              # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# Asegúrate de tener Postgres corriendo y haber ejecutado init.sql + seed_data.sql
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📝 Notas

- Los datos curriculares, reglamentos y procedimientos NO están incluidos: los aporta el equipo subiendo los PDFs oficiales desde el panel admin.
- El sistema de **temas festivos no está implementado** en esta versión (decisión de alcance).
- Para producción: rotar `JWT_SECRET`, usar TLS, desactivar `/docs`, configurar respaldos de Postgres y monitoreo.

## 📄 Licencia

Proyecto académico — Universidad Nacional de Trujillo, curso de Gestión de Servicios de TI.
-------------------------------------------------------------------
#aqui

## 🧪 Flujo de uso

1. Ingresa como **administrador** en `/login`.
2. Ve a **Panel admin → Documentos** y sube uno o más PDFs oficiales (sílabos, reglamentos, guías…). El sistema los indexa automáticamente (estado pasa de `pendiente` → `procesando` → `indexado`).
3. Cierra sesión y **regístrate como estudiante** con un correo `@unitru.edu.pe`.
4. Haz preguntas en el chat. UNT Bot recupera fragmentos relevantes y responde citando las fuentes.

## 🛠️ Comandos para arrancar el app (desarrollo local)

Si prefieres ejecutar frontend y backend por separado sin Docker:

### Backend (FastAPI)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # En Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
