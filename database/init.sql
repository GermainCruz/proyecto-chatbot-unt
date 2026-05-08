-- ============================================================
-- UNT Bot - Esquema inicial PostgreSQL
-- ============================================================

-- Extensiones
-- Nombre de la base de datos: bd_chabot
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- ROLES Y USUARIOS
-- ============================================================
CREATE TYPE rol_usuario AS ENUM ('estudiante', 'administrador');

CREATE TABLE usuarios (
    id_usuario        BIGSERIAL PRIMARY KEY,
    nombre_completo   VARCHAR(150) NOT NULL,
    correo            VARCHAR(120) NOT NULL UNIQUE
                      CHECK (correo ~* '^[a-z0-9._%+\-]+@unitru\.edu\.pe$'),
    contrasena_hash   VARCHAR(255) NOT NULL,
    rol               rol_usuario NOT NULL DEFAULT 'estudiante',
    avatar_url        TEXT,
    correo_verificado BOOLEAN DEFAULT FALSE,
    fecha_registro    TIMESTAMPTZ DEFAULT NOW(),
    ultimo_acceso     TIMESTAMPTZ,
    activo            BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_usuarios_rol ON usuarios(rol) WHERE activo = TRUE;

-- ============================================================
-- SESIONES (refresh tokens)
-- ============================================================
CREATE TABLE sesiones (
    id_sesion       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario      BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    refresh_token   TEXT NOT NULL UNIQUE,
    user_agent      TEXT,
    ip              INET,
    creada_en       TIMESTAMPTZ DEFAULT NOW(),
    expira_en       TIMESTAMPTZ NOT NULL,
    revocada        BOOLEAN DEFAULT FALSE
);
CREATE INDEX idx_sesiones_usuario ON sesiones(id_usuario) WHERE revocada = FALSE;

-- ============================================================
-- CONVERSACIONES Y MENSAJES
-- ============================================================
CREATE TABLE conversaciones (
    id_conversacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario      BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    titulo          VARCHAR(200) DEFAULT 'Nueva conversación',
    fijada          BOOLEAN DEFAULT FALSE,
    archivada       BOOLEAN DEFAULT FALSE,
    creada_en       TIMESTAMPTZ DEFAULT NOW(),
    actualizada_en  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_conversaciones_usuario ON conversaciones(id_usuario, actualizada_en DESC);
CREATE INDEX idx_conversaciones_titulo_trgm ON conversaciones USING gin (titulo gin_trgm_ops);

CREATE TYPE rol_mensaje AS ENUM ('user', 'assistant', 'system');

CREATE TABLE mensajes (
    id_mensaje      BIGSERIAL PRIMARY KEY,
    id_conversacion UUID NOT NULL REFERENCES conversaciones(id_conversacion) ON DELETE CASCADE,
    rol             rol_mensaje NOT NULL,
    contenido       TEXT NOT NULL,
    fuentes         JSONB,
    tokens_entrada  INTEGER,
    tokens_salida   INTEGER,
    latencia_ms     INTEGER,
    util            SMALLINT,
    creado_en       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_mensajes_conv ON mensajes(id_conversacion, creado_en);

-- ============================================================
-- KNOWLEDGE BASE: documentos y fragmentos vectorizados
-- ============================================================
CREATE TYPE estado_documento AS ENUM ('pendiente', 'procesando', 'indexado', 'error');

CREATE TABLE categorias_documento (
    id_categoria SERIAL PRIMARY KEY,
    nombre       VARCHAR(80) UNIQUE NOT NULL,
    descripcion  TEXT,
    icono        VARCHAR(40)
);

CREATE TABLE documentos (
    id_documento    BIGSERIAL PRIMARY KEY,
    id_categoria    INTEGER REFERENCES categorias_documento(id_categoria),
    titulo          VARCHAR(300) NOT NULL,
    descripcion     TEXT,
    formato         VARCHAR(10) NOT NULL DEFAULT 'pdf',
    ruta_archivo    TEXT NOT NULL,
    hash_archivo    CHAR(64) UNIQUE,
    tamano_bytes    BIGINT,
    estado          estado_documento DEFAULT 'pendiente',
    error_mensaje   TEXT,
    subido_por      BIGINT REFERENCES usuarios(id_usuario),
    fecha_subida    TIMESTAMPTZ DEFAULT NOW(),
    fecha_indexado  TIMESTAMPTZ,
    version         INTEGER DEFAULT 1,
    activo          BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_documentos_categoria ON documentos(id_categoria) WHERE activo = TRUE;
CREATE INDEX idx_documentos_estado ON documentos(estado);

CREATE TABLE fragmentos_documentos (
    id_fragmento  BIGSERIAL PRIMARY KEY,
    id_documento  BIGINT NOT NULL REFERENCES documentos(id_documento) ON DELETE CASCADE,
    indice_chunk  INTEGER NOT NULL,
    texto         TEXT NOT NULL,
    tokens        INTEGER,
    embedding     vector(1536),
    metadatos     JSONB,
    creado_en     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (id_documento, indice_chunk)
);
CREATE INDEX idx_fragmentos_embedding
  ON fragmentos_documentos
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 200);
CREATE INDEX idx_fragmentos_texto_trgm
  ON fragmentos_documentos USING gin (texto gin_trgm_ops);

-- Auditoría de búsquedas RAG
CREATE TABLE consultas_rag (
    id_consulta    BIGSERIAL PRIMARY KEY,
    id_mensaje     BIGINT REFERENCES mensajes(id_mensaje) ON DELETE CASCADE,
    pregunta       TEXT NOT NULL,
    fragmentos_ids BIGINT[],
    scores         REAL[],
    modelo_llm     VARCHAR(60),
    creado_en      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDITORÍA ADMINISTRATIVA
-- ============================================================
CREATE TABLE auditoria (
    id_auditoria  BIGSERIAL PRIMARY KEY,
    id_usuario    BIGINT REFERENCES usuarios(id_usuario),
    accion        VARCHAR(80) NOT NULL,
    entidad       VARCHAR(60),
    entidad_id    TEXT,
    detalles      JSONB,
    ip            INET,
    creado_en     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_auditoria_usuario ON auditoria(id_usuario, creado_en DESC);

-- ============================================================
-- TRIGGER: actualizar 'actualizada_en' al insertar mensaje
-- ============================================================
CREATE OR REPLACE FUNCTION fn_touch_conversacion() RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversaciones
     SET actualizada_en = NOW()
   WHERE id_conversacion = NEW.id_conversacion;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_touch_conv
AFTER INSERT ON mensajes
FOR EACH ROW EXECUTE FUNCTION fn_touch_conversacion();
