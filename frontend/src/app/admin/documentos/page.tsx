"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";

import { api, ApiError, type Categoria, type Documento } from "@/lib/api";
import { cn, formatBytes, formatDate } from "@/lib/utils";

const ESTADO_STYLE: Record<string, { label: string; cls: string; icon: any }> = {
  pendiente: { label: "Pendiente", cls: "bg-slate-100 text-slate-700", icon: Clock },
  procesando: { label: "Procesando", cls: "bg-amber-100 text-amber-800", icon: Loader2 },
  indexado: { label: "Indexado", cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  error: { label: "Error", cls: "bg-red-100 text-red-700", icon: AlertCircle },
};

export default function AdminDocumentosPage() {
  const [docs, setDocs] = useState<Documento[]>([]);
  const [cats, setCats] = useState<Categoria[]>([]);
  const [drag, setDrag] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [idCategoria, setIdCategoria] = useState<number | "">("");

  const cargar = useCallback(async () => {
    try {
      const [d, c] = await Promise.all([
        api.get<Documento[]>("/admin/documentos"),
        api.get<Categoria[]>("/admin/categorias"),
      ]);
      setDocs(d);
      setCats(c);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 4000);
    return () => clearInterval(t);
  }, [cargar]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Solo se aceptan archivos PDF");
      return;
    }
    if (!titulo.trim()) {
      setError("Coloca un título antes de subir");
      return;
    }
    setError(null);
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.append("titulo", titulo.trim());
      if (descripcion) fd.append("descripcion", descripcion);
      if (idCategoria) fd.append("id_categoria", String(idCategoria));
      fd.append("archivo", file);
      await api.upload("/admin/documentos", fd);
      setTitulo("");
      setDescripcion("");
      setIdCategoria("");
      if (inputRef.current) inputRef.current.value = "";
      await cargar();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("No se pudo subir el documento");
    } finally {
      setSubiendo(false);
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar este documento? Se borrarán también sus fragmentos.")) return;
    await api.delete(`/admin/documentos/${id}`);
    cargar();
  };

  const reprocesar = async (id: number) => {
    await api.post(`/admin/documentos/${id}/reprocesar`);
    cargar();
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-unt-blue-900 dark:text-unt-blue-100">
          Base de conocimiento
        </h1>
        <p className="text-sm text-slate-500">
          Sube los documentos oficiales (PDF) que alimentarán a UNT Bot.
        </p>
      </header>

      <section className="card p-6 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Título *</label>
            <input
              className="input"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Reglamento de matrícula 2026"
            />
          </div>
          <div>
            <label className="label">Categoría</label>
            <select
              className="input"
              value={idCategoria}
              onChange={(e) => setIdCategoria(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">— Sin categoría —</option>
              {cats.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Descripción</label>
            <input
              className="input"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "rounded-xl border-2 border-dashed p-8 text-center transition",
            drag
              ? "border-unt-blue-500 bg-unt-blue-50 dark:bg-unt-blue-900/20"
              : "border-slate-300 dark:border-slate-700",
          )}
        >
          <Upload className="mx-auto h-8 w-8 text-unt-blue-700" />
          <p className="mt-2 text-sm font-medium">
            Arrastra un PDF aquí o{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-unt-blue-700 underline"
            >
              selecciona un archivo
            </button>
          </p>
          <p className="text-xs text-slate-500 mt-1">Tamaño máximo 25 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {subiendo && (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-unt-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" /> Subiendo…
            </p>
          )}
          {error && (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" /> {error}
            </p>
          )}
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fragmentos</th>
                <th className="px-4 py-3">Tamaño</th>
                <th className="px-4 py-3">Subido</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    Aún no hay documentos cargados.
                  </td>
                </tr>
              )}
              {docs.map((d) => {
                const est = ESTADO_STYLE[d.estado];
                const Icon = est.icon;
                return (
                  <tr key={d.id_documento} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3">
                      <p className="font-medium">{d.titulo}</p>
                      {d.descripcion && (
                        <p className="text-xs text-slate-500">{d.descripcion}</p>
                      )}
                      {d.error_mensaje && (
                        <p className="text-xs text-red-600 mt-1">{d.error_mensaje}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {d.categoria?.nombre || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          est.cls,
                        )}
                      >
                        <Icon className={cn("h-3 w-3", d.estado === "procesando" && "animate-spin")} />
                        {est.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{d.fragmentos_count}</td>
                    <td className="px-4 py-3 text-slate-600">{formatBytes(d.tamano_bytes)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(d.fecha_subida)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => reprocesar(d.id_documento)}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-unt-blue-700 dark:hover:bg-slate-800"
                          title="Reprocesar"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => eliminar(d.id_documento)}
                          className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
