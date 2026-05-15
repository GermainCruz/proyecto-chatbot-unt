"use client";

import {
  Archive,
  ArchiveRestore,
  FileText,
  MessageSquareText,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { type Conversacion, type DocumentoBase } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

type Props = {
  conversaciones: Conversacion[];
  archivedChats?: Conversacion[];
  documentos: DocumentoBase[];
  activeId: string | null;
  mode: "documentos" | "historial";
  search: string;
  temasPorConversacion?: Record<string, string>;
  canNewChat?: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onArchive: (id: string) => void;
  onRestoreArchived?: (id: string) => void;
  onDelete: (id: string) => void;
  onSearchChange: (value: string) => void;
};

export function RightPanel({
  conversaciones,
  archivedChats = [],
  documentos,
  activeId,
  mode,
  search,
  temasPorConversacion = {},
  canNewChat,
  onSelect,
  onNew,
  onArchive,
  onRestoreArchived,
  onDelete,
  onSearchChange,
}: Props) {
  const historial = conversaciones.filter((conv) =>
    conv.titulo.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <aside className="hidden h-screen w-72 shrink-0 flex-col border-l border-chat-line bg-chat-shell px-4 py-4 text-zinc-200 lg:flex">
      <section className={cn(mode !== "documentos" && "opacity-55")}>
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          Documentos base
        </h2>
        {documentos.length === 0 ? (
          <p className="mt-4 text-xs leading-relaxed text-zinc-500">
            Aun no hay PDFs cargados. Los nombres apareceran aqui conforme alimentes QueryBot desde el panel de documentos.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {documentos.slice(0, 10).map((doc) => (
              <li key={doc.id_documento} className="flex items-start gap-2 text-xs font-semibold text-zinc-300">
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <span className="leading-tight">
                  {doc.titulo}
                  <span className="mt-1 block text-[10px] font-medium text-zinc-500">
                    {doc.categoria || "Sin categoria"} · {doc.fragmentos_count} fragmentos
                  </span>
                  {doc.estado !== "indexado" && (
                    <span className="mt-1 block text-[10px] font-medium text-amber-400">
                      {doc.estado}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={cn("mt-7 min-h-0 flex-1", mode !== "historial" && "opacity-55")}>
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          Historial
        </h2>
        <div className="mt-3 flex h-8 items-center gap-2 rounded-lg border border-zinc-700 bg-[#242422] px-2">
          <Search className="h-3.5 w-3.5 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar..."
            className="min-w-0 flex-1 bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
          />
        </div>
        <div className="mt-4 h-full overflow-y-auto pr-1 scrollbar-thin">
          {historial.length === 0 ? (
            <p className="text-xs text-zinc-500">Sin conversaciones aun.</p>
          ) : (
            <ul className="space-y-2">
              {historial.map((conv) => (
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
                    onClick={() => onArchive(conv.id_conversacion)}
                    className="rounded p-1 text-zinc-500 opacity-0 transition hover:text-chat-gold group-hover:opacity-100"
                    aria-label="Archivar conversacion"
                    title="Archivar"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelect(conv.id_conversacion)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex gap-2">
                      <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="querybot-history-title line-clamp-2 text-xs font-semibold leading-tight">
                          {conv.titulo}
                        </p>
                        <p className="mt-1 text-[10px] text-zinc-500">
                          {formatDate(conv.actualizada_en)}
                        </p>
                        <p className="mt-1 inline-flex rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">
                          {temasPorConversacion[conv.id_conversacion] || "Sin tema"}
                        </p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Eliminar conversacion?")) onDelete(conv.id_conversacion);
                    }}
                    className="rounded p-1 text-zinc-500 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                    aria-label="Eliminar conversacion"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {archivedChats.length > 0 && mode === "historial" && onRestoreArchived && (
          <div className="mt-6 border-t border-zinc-700 pt-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">
              Archivadas ({archivedChats.length})
            </h3>
            <p className="mt-1 text-[10px] leading-relaxed text-zinc-600">
              Pulsa restaurar para volver a verlas en el historial principal.
            </p>
            <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
              {archivedChats.map((conv) => (
                <li
                  key={conv.id_conversacion}
                  className="flex items-start gap-1 rounded-lg px-1 py-1.5 text-zinc-500 hover:bg-white/5"
                >
                  <button
                    type="button"
                    onClick={() => onRestoreArchived(conv.id_conversacion)}
                    className="rounded p-1 text-chat-gold hover:bg-white/10"
                    aria-label="Restaurar conversacion archivada"
                    title="Restaurar"
                  >
                    <ArchiveRestore className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelect(conv.id_conversacion)}
                    className="min-w-0 flex-1 text-left text-xs font-medium leading-tight text-zinc-400 hover:text-zinc-200"
                  >
                    <span className="querybot-history-title line-clamp-2">{conv.titulo}</span>
                    <span className="mt-0.5 block text-[10px] text-zinc-600">{formatDate(conv.actualizada_en)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={onNew}
        disabled={!canNewChat}
        className="mt-4 flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-500 text-sm font-bold text-zinc-100 transition hover:border-zinc-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Plus className="h-4 w-4" />
        Nuevo chat
      </button>
    </aside>
  );
}
