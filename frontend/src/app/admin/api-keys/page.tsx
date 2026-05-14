"use client";

import { useEffect, useState } from "react";
import { Key, Plus, Trash2, CheckCircle, Search, Loader2, AlertTriangle, ShieldCheck } from "lucide-react";

import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/Modal";

type ApiKey = {
  id_api_key: number;
  nombre: string;
  clave: string;
  activa: boolean;
  creada_en: string;
};

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  
  // Form state
  const [nombre, setNombre] = useState("");
  const [clave, setClave] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
    onConfirm: () => void;
    type: "info" | "danger" | "warning" | "success";
    confirmLabel?: string;
  }>({
    isOpen: false,
    title: "",
    content: "",
    onConfirm: () => {},
    type: "info"
  });

  const cargar = async () => {
    setLoading(true);
    try {
      const lista = await api.get<ApiKey[]>("/admin/api-keys");
      setKeys(lista);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const agregarClave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !clave) return;
    setAdding(true);
    setError(null);
    try {
      await api.post("/admin/api-keys", { nombre, clave });
      setNombre("");
      setClave("");
      cargar();
      setModalConfig({
        isOpen: true,
        title: "¡Éxito!",
        content: `La clave "${nombre}" ha sido registrada correctamente.`,
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
        type: "success",
        confirmLabel: "Entendido"
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(String(err.detail));
      } else {
        setError("Error al agregar la clave");
      }
    } finally {
      setAdding(false);
    }
  };

  const confirmarActivacion = (key: ApiKey) => {
    if (key.activa) return;
    setModalConfig({
      isOpen: true,
      title: "Activar Clave de API",
      content: `¿Estás seguro de activar la clave "${key.nombre}"? Esto actualizará la configuración del chatbot y el archivo .env inmediatamente.`,
      type: "warning",
      confirmLabel: "Sí, activar ahora",
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/admin/api-keys/${key.id_api_key}/activar`);
          cargar();
        } catch (err) {
          setModalConfig({
            isOpen: true,
            title: "Error de activación",
            content: "Hubo un problema al intentar activar la clave en el servidor. Por favor, revisa los logs del backend.",
            type: "danger",
            onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
            confirmLabel: "Cerrar"
          });
        }
      }
    });
  };

  const confirmarEliminacion = (key: ApiKey) => {
    if (key.activa) {
      setModalConfig({
        isOpen: true,
        title: "Acción no permitida",
        content: "No puedes eliminar la clave que está en uso actualmente. Primero debes asignar otra clave.",
        type: "danger",
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
        confirmLabel: "Entendido"
      });
      return;
    }

    setModalConfig({
      isOpen: true,
      title: "Eliminar Clave",
      content: `¿Estás seguro de que deseas eliminar la clave "${key.nombre}"? Esta acción no se puede deshacer.`,
      type: "danger",
      confirmLabel: "Eliminar permanentemente",
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/admin/api-keys/${key.id_api_key}`);
          cargar();
        } catch (err) {
          alert("Error al eliminar la clave");
        }
      }
    });
  };

  const filteredKeys = keys.filter(k => 
    k.nombre.toLowerCase().includes(query.toLowerCase()) ||
    k.clave.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-unt-blue-900 dark:text-unt-blue-100 flex items-center gap-2">
            <Key className="h-7 w-7 text-unt-gold-600" />
            Módulo de API Keys
          </h1>
          <p className="text-sm text-slate-500">
            Gestiona las credenciales de Google Gemini para el procesamiento del lenguaje.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <section className="lg:col-span-1">
          <div className="card p-5 space-y-4 border-t-4 border-unt-blue-600">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Plus className="h-5 w-5 text-unt-blue-600" />
              Nueva clave
            </h2>
            <form onSubmit={agregarClave} className="space-y-4">
              <div>
                <label className="label uppercase text-[10px] tracking-widest opacity-70">Nombre identificador</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Ej: Producción-2026"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label uppercase text-[10px] tracking-widest opacity-70">Clave secreta</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="AIzaSy..."
                  value={clave}
                  onChange={e => setClave(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {error}
                </div>
              )}
              <button 
                type="submit" 
                className="btn-primary w-full shadow-md shadow-unt-blue-700/20"
                disabled={adding}
              >
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar clave"}
              </button>
            </form>
          </div>
        </section>

        {/* Tabla */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por nombre o fragmento de clave..."
                className="input pl-9 h-11 border-slate-200"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="card overflow-hidden border border-slate-200 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Nombre</th>
                    <th className="px-6 py-4">Vista previa</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-16 text-center text-slate-400">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3 text-unt-blue-500" />
                        <span className="animate-pulse">Sincronizando con el servidor...</span>
                      </td>
                    </tr>
                  ) : filteredKeys.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <Search className="h-10 w-10 opacity-20" />
                          <p>No se encontraron resultados para tu búsqueda</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredKeys.map((k) => (
                      <tr key={k.id_api_key} className={cn(
                        "transition-colors group",
                        k.activa ? "bg-emerald-50/30 dark:bg-emerald-950/10" : "hover:bg-slate-50/50 dark:hover:bg-slate-900/50"
                      )}>
                        <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                          {k.nombre}
                        </td>
                        <td className="px-6 py-4">
                          <code className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {k.activa ? k.clave : `${k.clave.substring(0, 10)}••••••••`}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {k.activa ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              ACTIVA
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600">
                              En espera
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!k.activa && (
                              <button 
                                onClick={() => confirmarActivacion(k)}
                                className="btn-ghost h-9 px-4 text-xs font-bold text-unt-blue-600 hover:bg-unt-blue-50 dark:text-unt-blue-400 dark:hover:bg-unt-blue-900/30"
                              >
                                ASIGNAR
                              </button>
                            )}
                            <button 
                              onClick={() => confirmarEliminacion(k)}
                              className="btn-ghost h-9 w-9 p-0 text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <Modal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={modalConfig.title}
        type={modalConfig.type}
        footer={
          <button
            onClick={modalConfig.onConfirm}
            className={cn(
              "btn px-6 py-2 text-sm font-bold text-white shadow-lg transition-all",
              modalConfig.type === "danger" ? "bg-red-600 hover:bg-red-700 shadow-red-600/20" : 
              modalConfig.type === "warning" ? "bg-unt-gold-600 hover:bg-unt-gold-700 shadow-unt-gold-600/20" :
              "bg-unt-blue-700 hover:bg-unt-blue-800 shadow-unt-blue-700/20"
            )}
          >
            {modalConfig.confirmLabel || "Confirmar"}
          </button>
        }
      >
        <p className="leading-relaxed">{modalConfig.content}</p>
      </Modal>
    </div>
  );
}
