"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  Clock3,
  FileText,
  GraduationCap,
  LogOut,
  MessageSquarePlus,
  Search,
  Settings,
  Shield,
} from "lucide-react";

import { type Conversacion } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

type Props = {
  conversaciones: Conversacion[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
};

export function Sidebar({ activeId, onNew, onRefresh }: Props) {
  const { user, logout } = useAuth();

  useEffect(() => {
    const id = setInterval(onRefresh, 60_000);
    return () => clearInterval(id);
  }, [onRefresh]);

  const navItems = [
    { icon: GraduationCap, label: "Chat", active: true, onClick: undefined },
    { icon: MessageSquarePlus, label: "Nuevo chat", active: false, onClick: onNew },
    { icon: Search, label: "Buscar", active: false, onClick: undefined },
    { icon: Clock3, label: "Historial", active: Boolean(activeId), onClick: undefined },
    { icon: FileText, label: "Documentos", active: false, onClick: undefined },
  ];

  return (
    <aside className="flex h-screen w-[52px] shrink-0 flex-col items-center bg-chat-primary px-2 py-3 text-white">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-[11px] font-black tracking-wide">
        UNT
      </div>

      <nav className="mt-5 flex flex-1 flex-col items-center gap-3">
        {navItems.map(({ icon: Icon, label, active, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            title={label}
            aria-label={label}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-xl transition",
              active
                ? "bg-white/15 text-white"
                : "text-white/45 hover:bg-white/10 hover:text-white/85",
            )}
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </nav>

      <div className="flex flex-col items-center gap-3">
        {user?.rol === "administrador" && (
          <Link
            href="/admin"
            title="Panel admin"
            aria-label="Panel admin"
            className="grid h-8 w-8 place-items-center rounded-lg text-white/45 transition hover:bg-white/10 hover:text-white/85"
          >
            <Shield className="h-4 w-4" />
          </Link>
        )}
        <button
          type="button"
          title="Configuración"
          aria-label="Configuración"
          className="grid h-8 w-8 place-items-center rounded-lg text-white/45 transition hover:bg-white/10 hover:text-white/85"
        >
          <Settings className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={logout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className="grid h-8 w-8 place-items-center rounded-lg text-white/45 transition hover:bg-white/10 hover:text-white/85"
        >
          <LogOut className="h-4 w-4" />
        </button>
        <div
          title={user?.nombre_completo || "Usuario"}
          className="grid h-9 w-9 place-items-center rounded-full bg-chat-gold text-sm font-bold text-chat-primary"
        >
          {user?.nombre_completo?.[0]?.toUpperCase() || "U"}
        </div>
      </div>
    </aside>
  );
}
