"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Download,
  Archive,
  LogIn,
  MessageSquarePlus,
  Moon,
  Settings,
  Shield,
  Sun,
  Upload,
  UserRound,
} from "lucide-react";

import { type Conversacion } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

// Coloca tu logo en `frontend/public/logoUNT.png` o cambia esta ruta por tu imagen.
// Si el archivo no existe, QueryBot mostrara un bloque textual temporal.
const LOGO_SRC = "/logoUNT.png";

type Props = {
  conversaciones: Conversacion[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  onNavigate?: (mode: "documentos" | "historial" | "buscar") => void;
  onExportChats?: () => void;
  onDeleteAllChats?: () => void;
  canNewChat?: boolean;
  archivedChats: Conversacion[];
  onSelectArchived: (id: string) => void;
  onRestoreArchived: (id: string) => void;
};

export function Sidebar({
  conversaciones,
  onNew,
  onRefresh,
  onExportChats,
  onDeleteAllChats,
  canNewChat,
  archivedChats,
  onSelectArchived,
  onRestoreArchived,
}: Props) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [logoError, setLogoError] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [language, setLanguage] = useState<"es" | "en">("es");
  const txt = {
    es: {
      settingsTitle: "Configuracion de QueryBot",
      general: "General",
      dark: "Oscuro",
      light: "Claro",
      chats: "Chats",
      export: "Exportar",
      import: "Importar",
      archiveAll: "Archivar todos",
      deleteAll: "Eliminar todos",
      account: "Cuenta",
      accountNote: "La edicion de cuenta requiere endpoint dedicado; queda preparada como seccion visual.",
      about: "Sobre nosotros",
      aboutText: "QueryBot es un asistente academico que responde usando documentos oficiales cargados por el equipo del proyecto.",
      config: "Configuracion",
      archived: "Chats archivados",
      restore: "Restaurar",
      logout: "Cerrar sesion",
    },
    en: {
      settingsTitle: "QueryBot settings",
      general: "General",
      dark: "Dark",
      light: "Light",
      chats: "Chats",
      export: "Export",
      import: "Import",
      archiveAll: "Archive all",
      deleteAll: "Delete all",
      account: "Account",
      accountNote: "Account editing needs a dedicated endpoint; this section is visually ready.",
      about: "About us",
      aboutText: "QueryBot is an academic assistant that answers using official documents uploaded by the project team.",
      config: "Settings",
      archived: "Archived chats",
      restore: "Restore",
      logout: "Sign out",
    },
  }[language];

  useEffect(() => {
    const id = setInterval(onRefresh, 60_000);
    return () => clearInterval(id);
  }, [onRefresh]);

  return (
    <aside className="relative flex h-screen w-16 shrink-0 flex-col items-center bg-chat-primary px-2 py-3 text-white">
      <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-white/10">
        {!logoError ? (
          <img
            src={LOGO_SRC}
            alt="Logo universidad"
            className="h-full w-full object-contain p-1.5"
            onError={() => setLogoError(true)}
          />
        ) : (
          <span className="text-[10px] font-black tracking-wide">LOGO</span>
        )}
      </div>

      <nav className="mt-6 flex flex-1 flex-col items-center gap-3">
        <button
          type="button"
          onClick={onNew}
          disabled={!canNewChat}
          title="Nuevo chat"
          aria-label="Nuevo chat"
          className="grid h-10 w-10 place-items-center rounded-xl text-white/75 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
        >
          <MessageSquarePlus className="h-5 w-5" />
        </button>
      </nav>

      <div className="flex flex-col items-center gap-3">
        {user?.rol === "administrador" && (
          <Link
            href="/admin"
            title="Panel admin"
            aria-label="Panel admin"
            className="grid h-9 w-9 place-items-center rounded-lg text-white/55 transition hover:bg-white/10 hover:text-white"
          >
            <Shield className="h-4.5 w-4.5" />
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            setSettingsOpen((v) => !v);
            setAccountOpen(false);
          }}
          title="Configuracion"
          aria-label="Configuracion"
          className={cn(
            "grid h-9 w-9 place-items-center rounded-lg transition",
            settingsOpen ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/10 hover:text-white",
          )}
        >
          <Settings className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setAccountOpen((v) => !v);
            setSettingsOpen(false);
          }}
          title={user?.correo || "Cuenta"}
          aria-label="Cuenta"
          className="grid h-10 w-10 place-items-center rounded-full bg-chat-gold text-sm font-bold text-chat-primary shadow-sm ring-2 ring-white/10"
        >
          {user?.nombre_completo?.[0]?.toUpperCase() || "U"}
        </button>
        <p className="w-14 truncate text-center text-[10px] font-semibold text-white/75">
          {user?.nombre_completo?.split(" ")[0] || "Usuario"}
        </p>
      </div>

      {settingsOpen && (
        <div className="absolute bottom-16 left-14 z-40 w-80 rounded-xl border border-zinc-700 bg-[#242422] p-4 text-zinc-100 shadow-2xl">
          <h2 className="text-sm font-bold">{txt.settingsTitle}</h2>
          <div className="mt-4 space-y-4">
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">{txt.general}</h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-xs", theme === "dark" ? "border-chat-gold text-chat-gold" : "border-zinc-700 text-zinc-300")}
                >
                  <Moon className="h-4 w-4" /> {txt.dark}
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-xs", theme === "light" ? "border-chat-gold text-chat-gold" : "border-zinc-700 text-zinc-300")}
                >
                  <Sun className="h-4 w-4" /> {txt.light}
                </button>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "es" | "en")}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-[#1f1f1d] px-3 py-2 text-xs text-zinc-200"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </section>

            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">{txt.chats}</h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button type="button" onClick={onExportChats} className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:border-zinc-400">
                  <Download className="h-4 w-4" /> {txt.export}
                </button>
                <button type="button" className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-500" title="Disponible para una siguiente iteracion">
                  <Upload className="h-4 w-4" /> {txt.import}
                </button>
                <button type="button" className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-500" title="Archivado masivo requiere persistencia en backend">
                  {txt.archiveAll}
                </button>
                <button type="button" onClick={onDeleteAllChats} className="rounded-lg border border-red-500/40 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10">
                  {txt.deleteAll}
                </button>
              </div>
              <p className="mt-2 text-[10px] text-zinc-500">{conversaciones.length} chat(s) en historial.</p>
            </section>

            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">{txt.account}</h3>
              <div className="mt-2 rounded-lg border border-zinc-700 p-3 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4" />
                  <span className="truncate">{user?.nombre_completo}</span>
                </div>
                <p className="mt-1 truncate text-zinc-500">{user?.correo}</p>
                <p className="mt-2 text-zinc-500">{txt.accountNote}</p>
              </div>
            </section>

            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">{txt.about}</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                {txt.aboutText}
              </p>
            </section>
          </div>
        </div>
      )}

      {accountOpen && (
        <div className="absolute bottom-4 left-16 z-40 w-72 rounded-xl border border-zinc-700 bg-[#242422] p-3 text-zinc-100 shadow-2xl">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-chat-gold text-xs font-bold text-chat-primary">
              {user?.nombre_completo?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.nombre_completo || "Usuario"}</p>
              <p className="truncate text-xs text-zinc-400">{user?.correo}</p>
            </div>
          </div>

          <div className="mt-2 space-y-1">
            <button
              type="button"
              onClick={() => {
                setSettingsOpen(true);
                setAccountOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-zinc-100 transition hover:bg-white/10"
            >
              <Settings className="h-4 w-4 text-zinc-400" />
              {txt.config}
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-zinc-100 transition hover:bg-white/10"
            >
              <Archive className="h-4 w-4 text-zinc-400" />
              {txt.archived}
            </button>
            {archivedChats.length > 0 && (
              <div className="ml-7 max-h-36 space-y-1 overflow-y-auto pr-1">
                {archivedChats.map((chat) => (
                  <div key={chat.id_conversacion} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onSelectArchived(chat.id_conversacion)}
                      className="min-w-0 flex-1 truncate rounded px-2 py-1 text-left text-xs text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
                    >
                      {chat.titulo}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRestoreArchived(chat.id_conversacion)}
                      className="rounded px-2 py-1 text-[10px] text-chat-gold hover:bg-white/10"
                    >
                      {txt.restore}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="my-2 h-px bg-zinc-700" />

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-zinc-100 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogIn className="h-4 w-4 text-zinc-400" />
            {txt.logout}
          </button>
        </div>
      )}
    </aside>
  );
}
