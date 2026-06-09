# README_v2 - QueryBot UNT

## 1. Resumen ejecutivo

`QueryBot UNT` es un chatbot academico orientado a responder consultas de estudiantes de la Universidad Nacional de Trujillo a partir de documentos oficiales cargados por administradores. El proyecto implementa una arquitectura `RAG` (`Retrieval-Augmented Generation`), lo que significa que primero recupera fragmentos relevantes desde una base documental y luego usa un modelo generativo para redactar la respuesta.

En su estado actual, el sistema:

- Permite autenticacion con roles `estudiante` y `administrador`.
- Restringe el registro al dominio institucional `@unitru.edu.pe`.
- Gestiona carga e indexacion de PDFs oficiales.
- Organiza el chat por temas/categorias.
- Recupera informacion mediante busqueda hibrida.
- Genera respuestas con `Gemini`.
- Muestra fuentes documentales al usuario final.
- Registra historial de chats y feedback de utilidad.

El proyecto esta pensado como una solucion institucional para centralizar informacion dispersa en oficios, instructivos, reglamentos, formularios y tramites universitarios.

---

## 2. Objetivo del proyecto

### Objetivo general

Brindar a los estudiantes de la UNT un asistente conversacional capaz de responder dudas frecuentes usando exclusivamente documentos oficiales cargados al sistema.

### Objetivos especificos

- Reducir la dependencia de consultas manuales a oficinas administrativas.
- Disminuir tiempos de busqueda de informacion.
- Mejorar el acceso a procedimientos recurrentes como matricula, carné, comedor, certificado de estudios o carpeta URA.
- Centralizar documentos institucionales en una base consultable.
- Ofrecer trazabilidad mediante historial, fuentes y retroalimentacion.

---

## 3. Problema que busca resolver

En muchas universidades, la informacion sobre procesos academicos y administrativos:

- Esta distribuida en PDFs, oficios, anuncios y portales distintos.
- No siempre es facil de interpretar para el estudiante.
- Suele requerir busqueda manual o contacto con oficinas.
- Genera dudas repetitivas en tramites recurrentes.

`QueryBot UNT` busca convertir esa documentacion en un sistema conversacional util, accesible y contextualizado.

---

## 4. Alcance funcional

### Incluye

- Registro e inicio de sesion.
- Gestion de usuarios.
- Panel administrativo.
- Carga de documentos PDF.
- Indexacion automatica en segundo plano.
- Deteccion de PDFs escaneados o de baja calidad textual.
- Recuperacion hibrida por similitud semantica y coincidencia lexical.
- Chat con historial, temas y fuentes.
- Feedback del usuario sobre respuestas.
- Metricas basicas de uso y vacios de conocimiento.

### No incluye actualmente

- OCR real integrado para rescatar PDFs escaneados.
- Workflow de aprobacion editorial de contenido.
- Evaluacion automatica de calidad de respuestas.
- Re-ranking con modelo dedicado.
- Cache semantico o cache de contexto a nivel de categoria.
- Orquestacion multiagente.
- Integraciones institucionales externas.

---

## 5. Usuarios y roles

### Estudiante

- Se registra con correo institucional.
- Inicia sesion y accede al chat.
- Selecciona tema si desea acotar la consulta.
- Ve historial de conversaciones.
- Puede calificar si la respuesta fue util o no.

### Administrador

- Accede al panel administrativo.
- Gestiona usuarios.
- Carga y elimina documentos.
- Reprocesa documentos.
- Consulta metricas.
- Administra la base documental que alimenta al chatbot.

---

## 6. Stack tecnologico

| Capa | Tecnologia |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11, SQLAlchemy 2, Pydantic |
| Base de datos | PostgreSQL 16 |
| Extension vectorial | `pgvector` |
| Extension lexical | `pg_trgm` |
| LLM | Google Gemini (`gemini-2.5-pro`) |
| Embeddings | `text-embedding-004` |
| Procesamiento PDF | `pdfplumber` |
| Autenticacion | JWT + refresh tokens |
| Contenedores | Docker Compose |

---

## 7. Arquitectura general

El sistema sigue una arquitectura web de tres capas:

1. `Frontend`
   - Interfaz de usuario en Next.js.
   - Consume la API REST del backend.
   - Gestiona sesion, chat, panel admin, historial y feedback.

2. `Backend`
   - Expone endpoints REST para autenticacion, chat y administracion.
   - Ejecuta el pipeline RAG.
   - Procesa e indexa documentos.
   - Controla permisos por rol.

3. `Base de datos`
   - Guarda usuarios, sesiones, conversaciones, mensajes, documentos y fragmentos.
   - Almacena embeddings vectoriales y soporta busqueda semantica y lexical.

### Flujo simplificado

1. El administrador sube un PDF.
2. El backend extrae texto, lo divide en fragmentos y genera embeddings.
3. Los fragmentos se guardan en PostgreSQL.
4. El estudiante hace una pregunta.
5. El backend recupera fragmentos relevantes.
6. Esos fragmentos se envian a Gemini.
7. Gemini redacta una respuesta estructurada.
8. La respuesta y sus fuentes se guardan y se muestran en la interfaz.

---

## 8. Estructura del repositorio

```text
proyecto-chatbot-unt/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── styles/
│   ├── package.json
│   └── Dockerfile
├── database/
│   ├── init.sql
│   └── seed_data.sql
├── documentos/
├── docker-compose.yml
├── .env
├── README.md
└── README_v2.md
```

---

## 9. Variables de entorno relevantes

El proyecto trabaja principalmente con el archivo `.env` en la raiz.

Variables importantes:

```env
POSTGRES_USER=untbot
POSTGRES_PASSWORD=untbot
POSTGRES_DB=untbot
POSTGRES_HOST_PORT=5434

DATABASE_URL=postgresql+psycopg://untbot:untbot@localhost:5434/untbot
JWT_SECRET=coloca-una-clave-larga-y-segura
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

GOOGLE_API_KEY=PEGA_AQUI_TU_API_KEY
LLM_MODEL=gemini-2.5-pro
EMBEDDING_MODEL=text-embedding-004
EMBEDDING_DIM=768
LLM_MAX_OUTPUT_TOKENS=8192

ADMIN_EMAIL=admin@unitru.edu.pe
ADMIN_PASSWORD=Admin1234*
ADMIN_NAME=Administrador UNT Bot

STORAGE_DIR=documentos
NEXT_PUBLIC_API_URL=/api
BACKEND_URL=http://127.0.0.1:8000
```

### Observacion importante

Actualmente el proyecto fue simplificado para trabajar solo con `Gemini`, por lo que la variable principal del modelo es `GOOGLE_API_KEY`.

---

## 10. Despliegue con Docker

### Servicios principales

- `db`: PostgreSQL + extensiones vectoriales.
- `backend`: FastAPI.
- `frontend`: Next.js.

### Levantar entorno

```bash
docker compose up -d --build
```

### Reconstruir backend y frontend

```bash
docker compose up -d --build --force-recreate backend frontend
```

### Reiniciar solo el backend

```bash
docker compose restart backend
```

### URLs

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8001`
- Swagger: `http://localhost:8001/docs`

---

## 11. Base de datos y modelo de informacion

### Tablas principales

- `usuarios`
- `sesiones`
- `conversaciones`
- `mensajes`
- `categorias_documento`
- `documentos`
- `fragmentos_documentos`
- `consultas_rag`
- `auditoria`

### Aspectos importantes del esquema

- Los roles de usuario estan tipados con `ENUM`.
- Los mensajes guardan `tokens_entrada`, `tokens_salida`, `latencia_ms` y `fuentes`.
- Los documentos tienen estado de procesamiento:
  - `pendiente`
  - `procesando`
  - `indexado`
  - `error`
  - `requiere_revision`
- Los fragmentos almacenan embeddings en `vector(768)`.
- Se usa indice `HNSW` para busqueda vectorial.
- Se usa `pg_trgm` para similitud lexical.

---

## 12. Pipeline RAG actual

### 12.1 Ingestion documental

Cuando un administrador sube un PDF:

1. Se valida que sea PDF y que no exceda el peso maximo.
2. Se calcula un hash SHA-256 para evitar duplicados.
3. El archivo se guarda en disco.
4. Se crea el registro del documento.
5. Un proceso en background indexa el contenido.

### 12.2 Extraccion y chunking

El servicio `pdf_loader.py`:

- Extrae texto por pagina con `pdfplumber`.
- Limpia espacios y saltos innecesarios.
- Detecta si el PDF parece escaneado sin OCR.
- Divide el contenido en fragmentos usando separadores semanticos.

### 12.3 Embeddings

El servicio `embeddings.py`:

- Usa `text-embedding-004` cuando hay clave valida de Gemini.
- Si no hay clave valida, puede caer a un embedding determinista de demostracion.

### 12.4 Recuperacion

El servicio `rag.py`:

- Normaliza la pregunta.
- Detecta intencion.
- Puede expandir la consulta si la primera busqueda falla.
- Hace busqueda hibrida:
  - similitud vectorial con `pgvector`
  - similitud lexical con `pg_trgm`
- Filtra por categoria si el usuario eligio un tema.
- Selecciona fragmentos para el LLM y fuentes para la UI.

### 12.5 Generacion

El servicio `llm.py`:

- Construye un prompt con contexto oficial.
- Usa `gemini-2.5-pro`.
- Aplica reintentos ante errores de cuota `429`.
- Fuerza un formato estructurado:
  - `Respuesta`
  - `Detalles`
  - `Fuente`
- Si la API falla, usa una respuesta local de respaldo.

### 12.6 Postprocesado

El servicio `formato_respuesta.py`:

- Limpia respuestas del modelo.
- Corrige listas.
- Homogeneiza encabezados.
- Reduce basura de formato antes de mostrar el mensaje en el chat.

---

## 13. API principal

### Autenticacion

- `POST /api/auth/registro`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Chat

- `GET /api/chat/temas`
- `GET /api/chat/documentos-base`
- `GET /api/chat/conversaciones`
- `POST /api/chat/conversaciones`
- `GET /api/chat/conversaciones/{id}`
- `PATCH /api/chat/conversaciones/{id}`
- `DELETE /api/chat/conversaciones/{id}`
- `POST /api/chat/conversaciones/{id}/mensajes`
- `POST /api/chat/mensajes/{id}/feedback`

### Administracion

- `GET /api/admin/categorias`
- `GET /api/admin/documentos`
- `POST /api/admin/documentos`
- `POST /api/admin/documentos/{id}/reprocesar`
- `DELETE /api/admin/documentos/{id}`
- `GET /api/admin/usuarios`
- `PATCH /api/admin/usuarios/{id}`
- `GET /api/admin/metricas`

---

## 14. Frontend: experiencia de usuario actual

### Pantallas principales

- `login`
- `registro`
- `chat`
- `admin`
- `admin/documentos`
- `admin/usuarios`

### Funcionalidades visibles

- Seleccion de tema.
- Historial de chats.
- Chats archivados.
- Input de texto.
- Adjuntar PDF.
- Grabacion por voz en navegador.
- Fuentes desplegables.
- Feedback de utilidad.
- Preguntas frecuentes por tema.
- Cambio de tema visual y modo oscuro/claro.

### Comportamiento relevante del chat

- Si se selecciona un tema, la consulta viaja con `id_categoria`.
- Si el tema no tiene PDFs indexados, el backend responde que no cuenta con documentos para ese tema.
- El historial se conserva y se puede buscar.

---

## 15. Funcionalidades administrativas

### Gestion documental

- Carga de documentos por formulario.
- Campo de palabras clave.
- Estado del documento visible.
- Reprocesamiento.
- Eliminacion.

### Gestion de usuarios

- Listado de cuentas.
- Cambio de rol.
- Activacion y desactivacion.

### Metricas

- Total de usuarios.
- Total de documentos.
- Documentos indexados.
- Total de fragmentos.
- Conversaciones y mensajes.
- Feedback util/no util.
- Vacios de conocimiento.

---

## 16. Seguridad y control de acceso

- Registro restringido a dominio institucional.
- Contrasenas hasheadas.
- Access token + refresh token.
- Revocacion de sesiones.
- Rutas protegidas por rol.
- Validacion de tipo y tamano de PDF.
- Prevencion de duplicados por hash.

---

## 17. Fortalezas actuales del proyecto

- Arquitectura clara y separada por capas.
- Base RAG funcional con mejoras reales frente a un buscador simple.
- Soporte para categorias/temas.
- Panel administrativo util.
- Persistencia de historial y feedback.
- Preparado para Docker y entorno local.
- Uso de fuentes y trazabilidad.
- Deteccion inicial de PDFs escaneados.

---

## 18. Limitaciones actuales

- La calidad depende mucho de la calidad del PDF cargado.
- El sistema aun puede fallar si la pregunta y el fragmento usan formulaciones muy distintas.
- La busqueda hibrida aun no incorpora un reranker dedicado.
- La organizacion de la respuesta todavia depende del cumplimiento del prompt por parte del modelo.
- No existe evaluacion automatica de precision.
- No hay cache semantico ni reutilizacion inteligente de contexto.
- No hay OCR integrado para rescatar documentos escaneados.
- Las FAQs estan codificadas manualmente en frontend.

---

## 19. Casos de uso representativos

- Consultar requisitos para el comedor universitario.
- Consultar pasos y cronograma de matricula.
- Consultar tramite de carné universitario.
- Consultar certificado de estudios.
- Consultar proceso del Gym UNT.
- Consultar elaboracion de carpeta URA.

---

## 20. Riesgos operativos

- Caidas o cuotas de la API de Gemini.
- PDFs mal escaneados o con mala extraccion.
- Respuestas incompletas cuando la consulta es muy general.
- Respuestas negativas aunque exista informacion, si la recuperacion no trae el fragmento correcto.
- Costos o latencia crecientes al aumentar volumen documental y de usuarios.

---

## 21. Estado actual del proyecto

En la conversacion y evolucion reciente del proyecto ya se trabajaron estos puntos:

- Eliminacion del modulo visual de multiples claves API.
- Simplificacion para usar solo `Gemini`.
- Filtro de temas por documentos realmente indexados.
- Mejoras al historial y panel derecho.
- Mejoras a la estructura visual de la respuesta.
- Incorporacion de preguntas frecuentes por tema.
- Deteccion de documentos que requieren revision.
- Busqueda hibrida y mejoras al chunking.

Esto indica que el proyecto ya paso de un prototipo basico a una version funcional con enfoque institucional, aunque todavia requiere una siguiente fase orientada a precision, consistencia y escalabilidad.

---

## 22. Recomendaciones de uso para redactar un articulo

Si este proyecto va a describirse en un articulo academico o tecnico, conviene presentarlo como:

- Un chatbot universitario basado en `RAG`.
- Un sistema de consulta sobre documentacion oficial.
- Una solucion institucional para gestion del conocimiento.
- Un caso de uso real de `IA generativa + recuperacion vectorial`.
- Un proyecto con enfoque en trazabilidad y control administrativo.

Elementos que vale la pena destacar:

- Problema real que resuelve.
- Arquitectura implementada.
- Flujo de indexacion documental.
- Uso de `pgvector` + `pg_trgm`.
- Limitaciones encontradas.
- Mejoras iterativas realizadas durante el desarrollo.

---

## 23. Conclusión

`QueryBot UNT` es un proyecto con una base tecnica solida para convertirse en un asistente academico institucional confiable. Su mayor valor esta en combinar una interfaz usable con una base documental administrable y un pipeline RAG capaz de fundamentar las respuestas en documentos oficiales.

Su siguiente etapa de madurez no depende tanto de rediseños esteticos, sino de mejorar:

- la precision del retrieval,
- la consistencia del formato de respuesta,
- el control de calidad de documentos,
- la evaluacion de resultados,
- y la reutilizacion inteligente del contexto.

