const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const ACCESS_KEY = "untbot_access";
const REFRESH_KEY = "untbot_refresh";

export const tokenStorage = {
  getAccess: () => (typeof window !== "undefined" ? localStorage.getItem(ACCESS_KEY) : null),
  getRefresh: () => (typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null),
  set: (access: string, refresh: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    document.cookie = `untbot_access=${access}; path=/; max-age=${60 * 60}`;
  },
  clear: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    document.cookie = "untbot_access=; path=/; max-age=0";
  },
};

class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown, message: string) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

async function refreshTokens(): Promise<boolean> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    tokenStorage.set(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = tokenStorage.getAccess();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    const ok = await refreshTokens();
    if (ok) return request<T>(path, options, false);
    tokenStorage.clear();
  }

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      (isJson && (data as any).detail) ||
      `Error ${res.status} en ${path}`;
    throw new ApiError(res.status, data, String(message));
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, form: FormData) =>
    request<T>(path, { method: "POST", body: form }),
};

export { ApiError };

export type Usuario = {
  id_usuario: number;
  nombre_completo: string;
  correo: string;
  rol: "estudiante" | "administrador";
  activo: boolean;
};

export type Conversacion = {
  id_conversacion: string;
  titulo: string;
  fijada: boolean;
  archivada: boolean;
  creada_en: string;
  actualizada_en: string;
};

export type Fuente = {
  id_fragmento: number;
  titulo: string;
  pagina: number | null;
  score: number;
};

export type Mensaje = {
  id_mensaje: number;
  rol: "user" | "assistant" | "system";
  contenido: string;
  fuentes: Fuente[] | null;
  util: number | null;
  creado_en: string;
};

export type ConversacionDetalle = Conversacion & { mensajes: Mensaje[] };

export type TemaChat = {
  id_categoria: number;
  nombre: string;
  descripcion?: string | null;
  icono?: string | null;
  documentos_count: number;
};

export type DocumentoBase = {
  id_documento: number;
  titulo: string;
  estado: "pendiente" | "procesando" | "indexado" | "error";
  categoria?: string | null;
  fragmentos_count: number;
};

export type Categoria = {
  id_categoria: number;
  nombre: string;
  descripcion?: string | null;
  icono?: string | null;
};

export type Documento = {
  id_documento: number;
  titulo: string;
  descripcion?: string | null;
  formato: string;
  estado: "pendiente" | "procesando" | "indexado" | "error";
  error_mensaje?: string | null;
  tamano_bytes?: number | null;
  fecha_subida: string;
  fecha_indexado?: string | null;
  categoria?: Categoria | null;
  activo: boolean;
  fragmentos_count: number;
};

export type Metricas = {
  total_usuarios: number;
  total_estudiantes: number;
  total_admins: number;
  total_documentos: number;
  documentos_indexados: number;
  total_fragmentos: number;
  total_conversaciones: number;
  total_mensajes: number;
  mensajes_utiles: number;
  mensajes_no_utiles: number;
};
