"use client";

import { FileText, MessageSquareText, Plus, Trash2 } from "lucide-react";

import { type Conversacion } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

const DOCUMENTOS = [
  "Sílabos",
  "Reglamento de Matrícula",
  "Proceso de Bachiller",
  "Bienestar Universitario",
  "Currícula Vigente",
];

type Props = {
  conversaciones: Conversacion[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
};

export function RightPanel({
  conversaciones,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: Props) {
  return (
    <aside className="hidden h-screen w-52 shrink-0 flex-col border-l border-chat-line bg-chat-shell px-3 py-4 text-zinc-200 lg:flex">
      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          Documentos base
        </h2>
        <ul className="mt-4 space-y-3">
          {DOCUMENTOS.map((doc) => (
            <li key={doc} className="flex items-start gap-2 text-xs font-semibold text-zinc-300">
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <span className="leading-tight">{doc}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-7 min-h-0 flex-1">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          Historial
        </h2>
        <div className="mt-4 h-full overflow-y-auto pr-1 scrollbar-thin">
          {conversaciones.length === 0 ? (
            <p className="text-xs text-zinc-500">Sin conversaciones aún.</p>
          ) : (
            <ul className="space-y-2">
              {conversaciones.map((conv) => (
                <li
                  key={conv.id_conversacion}
                  className={cn(
                    "group flex items-start gap-2 rounded-lg px-2 py-2 transition",
                    conv.id_conversacion === activeId
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(conv.id_conversacion)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex gap-2">
                      <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-xs font-semibold leading-tight">
                          {conv.titulo}
                        </p>
                        <p className="mt-1 text-[10px] text-zinc-500">
                          {formatDate(conv.actualizada_en)}
                        </p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("¿Eliminar conversación?")) onDelete(conv.id_conversacion);
                    }}
                    className="rounded p-1 text-zinc-500 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                    aria-label="Eliminar conversación"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <button
        type="button"
        onClick={onNew}
        className="mt-4 flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-500 text-sm font-bold text-zinc-100 transition hover:border-zinc-300 hover:bg-white/5"
      >
        <Plus className="h-4 w-4" />
        Nuevo chat
      </button>
    </aside>
  );
}
