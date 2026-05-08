"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  FileStack,
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
  Users,
} from "lucide-react";

import { api, type Metricas } from "@/lib/api";

const CARDS = [
  { key: "total_usuarios", label: "Usuarios", icon: Users, color: "text-unt-blue-700" },
  { key: "total_documentos", label: "Documentos", icon: FileStack, color: "text-unt-gold-600" },
  { key: "documentos_indexados", label: "Indexados", icon: CheckCircle2, color: "text-emerald-600" },
  { key: "total_mensajes", label: "Mensajes", icon: MessageSquare, color: "text-violet-600" },
  { key: "mensajes_utiles", label: "Útiles", icon: ThumbsUp, color: "text-emerald-500" },
  { key: "mensajes_no_utiles", label: "No útiles", icon: ThumbsDown, color: "text-red-500" },
] as const;

export default function AdminDashboardPage() {
  const [m, setM] = useState<Metricas | null>(null);

  useEffect(() => {
    let mounted = true;
    const cargar = async () => {
      try {
        const data = await api.get<Metricas>("/admin/metricas");
        if (mounted) setM(data);
      } catch {
        /* noop */
      }
    };
    cargar();
    const t = setInterval(cargar, 15_000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  const utilidad =
    m && m.mensajes_utiles + m.mensajes_no_utiles > 0
      ? Math.round(
          (m.mensajes_utiles / (m.mensajes_utiles + m.mensajes_no_utiles)) * 100,
        )
      : null;

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-unt-blue-900 dark:text-unt-blue-100">
          Panel administrador
        </h1>
        <p className="text-sm text-slate-500">Métricas globales del chatbot UNT.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <div key={c.key} className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{c.label}</p>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <p className="mt-2 text-3xl font-bold">
              {m ? (m as any)[c.key].toLocaleString("es-PE") : "—"}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Conversaciones totales</p>
          <p className="mt-2 text-3xl font-bold">
            {m ? m.total_conversaciones.toLocaleString("es-PE") : "—"}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Fragmentos vectorizados</p>
          <p className="mt-2 text-3xl font-bold">
            {m ? m.total_fragmentos.toLocaleString("es-PE") : "—"}
          </p>
        </div>
      </div>

      <div className="card p-5">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Tasa de utilidad
        </p>
        <div className="mt-3">
          {utilidad === null ? (
            <p className="text-sm text-slate-400">Aún no hay feedback de estudiantes.</p>
          ) : (
            <>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-unt-blue-700">{utilidad}%</span>
                <span className="text-sm text-slate-500">de respuestas marcadas útiles</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-unt-blue-700 to-unt-gold-500 transition-all"
                  style={{ width: `${utilidad}%` }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
