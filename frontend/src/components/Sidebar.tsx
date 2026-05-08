"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  LogOut,
  MessageSquarePlus,
  Search,
  Shield,
  Trash2,
} from "lucide-react";

import { Logo } from "@/components/Logo";
import { type Conversacion } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn, formatDate } from "@/lib/utils";

type Props = {
  conversaciones: Conversacion[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
};

export function Sidebar({
  conversaciones,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRefresh,
}: Props) {
  const { user, logout } = useAuth();
  const [q, setQ] = useState("");

  const filtradas = useMemo(() => {
    if (!q.trim()) return conversaciones;
    const t = q.toLowerCase();
    return conversaciones.filter((c) => c.titulo.toLowerCase().includes(t));
  }, [conversaciones, q]);

  useEffect(() => {
    const id = setInterval(onRefresh, 60_000);
    return () => clearInterval(id);
  }, [onRefresh]);

  return (
    <aside className="hidden md:flex h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="p-4">
        <Logo />
      </div>

      <div className="px-3">
        <button onClick={onNew} className="btn-gold w-full">
          <MessageSquarePlus className="h-4 w-4" />
          Nuevo chat
        </button>
      </div>

      <div className="px-3 mt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar en historial…"
            className="input pl-8 py-1.5 text-sm"
          />
        </div>
      </div>

      <nav className="mt-4 flex-1 overflow-y-auto scrollbar-thin px-2">
        <p className="px-2 pb-2 text-[11px] uppercase tracking-wider text-slate-400">
          Historial
        </p>
        {filtradas.length === 0 && (
          <p className="px-2 text-xs text-slate-400">Aún no tienes conversaciones.</p>
        )}
        <ul className="space-y-0.5">
          {filtradas.map((c) => (
            <li key={c.id_conversacion}>
              <div
                className={cn(
                  "group flex items-center gap-1 rounded-lg px-2 py-1.5",
                  c.id_conversacion === activeId
                    ? "bg-unt-blue-50 text-unt-blue-900 dark:bg-unt-blue-800/40 dark:text-unt-blue-100"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800/60",
                )}
              >
                <button
                  onClick={() => onSelect(c.id_conversacion)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-medium">{c.titulo}</p>
                  <p className="text-[10px] text-slate-400">{formatDate(c.actualizada_en)}</p>
                </button>
                <button
                  onClick={() => {
                    if (confirm("¿Eliminar conversación?")) onDelete(c.id_conversacion);
                  }}
                  className="opacity-0 group-hover:opacity-100 rounded p-1 text-slate-400 hover:text-red-500"
                  aria-label="Eliminar conversación"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-unt-blue-700 text-white text-sm font-semibold">
            {user?.nombre_completo?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.nombre_completo}</p>
            <p className="truncate text-[11px] text-slate-500">{user?.correo}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {user?.rol === "administrador" && (
            <Link href="/admin" className="btn-ghost text-xs col-span-2 justify-start">
              <Shield className="h-3.5 w-3.5" />
              Panel admin
            </Link>
          )}
          <button
            onClick={logout}
            className="btn-ghost text-xs col-span-2 justify-start hover:text-red-500"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
