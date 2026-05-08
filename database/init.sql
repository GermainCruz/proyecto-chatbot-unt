-- Habilitar extensión vectorial
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- USUARIOS: solo permitir @unitru.edu.pe (a nivel de aplicación,
-- pero aquí aseguramos formato con restricción CHECK).
-- ============================================================
CREATE TABLE usuarios (
    id_usuario         BIGSERIAL PRIMARY KEY,
    nombre_completo    VARCHAR(150)   NOT NULL,
    correo             VARCHAR(120)   NOT NULL UNIQUE
                        CHECK (correo ~* '^[a-z0-9._%+\-]+@unitru\.edu\.pe$'),
    contrasena_hash    VARCHAR(255)   NOT NULL,
    rol                VARCHAR(20)    DEFAULT 'estudiante',
    fecha_registro     TIMESTAMP      DEFAULT NOW(),
    activo             BOOLEAN        DEFAULT TRUE
);

-- ============================================================
-- SESIONES (JWT refresh tokens, opcional)
-- ============================================================
CREATE TABLE sesiones (
    id_sesion          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario         BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    refresh_token      TEXT NOT NULL UNIQUE,
    creada_en          TIMESTAMP DEFAULT NOW(),
    expira_en          TIMESTAMP NOT NULL
);

-- ============================================================
-- CONVERSACIONES (agrupa mensajes; una conversación por usuario)
-- ============================================================
CREATE TABLE conversaciones (
    id_conversacion    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario         BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    titulo             VARCHAR(200) DEFAULT 'Nueva conversación',
    creada_en          TIMESTAMP DEFAULT NOW(),
    actualizada_en     TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- MENSAJES dentro de una conversación
-- ============================================================
CREATE TABLE mensajes (
    id_mensaje         BIGSERIAL PRIMARY KEY,
    id_conversacion    UUID NOT NULL REFERENCES conversaciones(id_conversacion) ON DELETE CASCADE,
    rol                VARCHAR(10) NOT NULL CHECK (rol IN ('user', 'assistant')),
    contenido          TEXT NOT NULL,
    fuentes            JSONB,        -- fragmentos usados para la respuesta (RAG)
    creado_en          TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- DOCUMENTOS (información oficial subida por el equipo)
-- ============================================================
CREATE TABLE documentos (
    id_documento       BIGSERIAL PRIMARY KEY,
    titulo             VARCHAR(300) NOT NULL,
    descripcion        TEXT,
    categoria          VARCHAR(50)   -- ej. 'silabo', 'matricula', 'bienestar'
                        NOT NULL DEFAULT 'general',
    formato            VARCHAR(10)   NOT NULL DEFAULT 'pdf',
    fecha_subida       TIMESTAMP DEFAULT NOW(),
    activo             BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- FRAGMENTOS (chunks de documentos con embeddings)
-- ============================================================
CREATE TABLE fragmentos_documentos (
    id_fragmento       BIGSERIAL PRIMARY KEY,
    id_documento       BIGINT NOT NULL REFERENCES documentos(id_documento) ON DELETE CASCADE,
    texto              TEXT NOT NULL,
    embedding          vector(1536),  -- dimensión según modelo de embeddings (ej. text-embedding-3-small)
    metadatos          JSONB,         -- página, sección, número de párrafo, etc.
    creado_en          TIMESTAMP DEFAULT NOW()
);

-- Índice para búsqueda vectorial (IVFFlat, requiere entrenamiento)
-- Un índice HNSW sería más rápido para consultas en tiempo real.
CREATE INDEX idx_fragmentos_embedding ON fragmentos_documentos
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 200);

-- ============================================================
-- CONFIGURACIÓN DE TEMAS FESTIVOS
-- ============================================================
CREATE TABLE temas_festivos (
    id_tema            SERIAL PRIMARY KEY,
    nombre             VARCHAR(100) NOT NULL,      -- 'San Valentín', 'Navidad', 'Fiestas Patrias'
    fecha_inicio       DATE NOT NULL,
    fecha_fin          DATE NOT NULL,
    colores            JSONB NOT NULL,             -- {'primary':'#...', 'secondary':'#...', 'accent':'#...'}
    css_personalizado  TEXT,                       -- reglas CSS adicionales inyectadas
    activo             BOOLEAN DEFAULT TRUE,
    CHECK (fecha_fin >= fecha_inicio)
);

-- Índice para obtener el tema activo rápidamente según la fecha actual
CREATE INDEX idx_temas_fechas ON temas_festivos (fecha_inicio, fecha_fin);