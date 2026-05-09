"use client";

import { FileText, MessageSquareText, Plus, Search, Trash2 } from "lucide-react";

import { type Conversacion, type DocumentoBase } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

const DOCUMENTOS = [
  { id_documento: -1, titulo: "Sílabos", estado: "pendiente", categoria: null, fragmentos_count: 0 },
  { id_documento: -2, titulo: "Reglamento de Matrícula", estado: "pendiente", categoria: null, fragmentos_count: 0 },
  { id_documento: -3, titulo: "Proceso de Bachiller", estado: "pendiente", categoria: null, fragmentos_count: 0 },
  { id_documento: -4, titulo: "Bienestar Universitario", estado: "pendiente", categoria: null, fragmentos_count: 0 },
  { id_documento: -5, titulo: "Currícula Vigente", estado: "pendiente", categoria: null, fragmentos_count: 0 },
];

type Props = {
  conversaciones: Conversacion[];
  documentos: DocumentoBase[];
  activeId: string | null;
  mode: "documentos" | "historial";
  search: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onSearchChange: (value: string) => void;
};

export function RightPanel({
  conversaciones,
  documentos,
  activeId,
  mode,
  search,
  onSelect,
  onNew,
  onDelete,
  onSearchChange,
}: Props) {
  const docsVisibles = documentos.length > 0 ? documentos : (DOCUMENTOS as DocumentoBase[]);
  const historial = conversaciones.filter((conv) =>
    conv.titulo.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <aside className="hidden h-screen w-52 shrink-0 flex-col border-l border-chat-line bg-chat-shell px-3 py-4 text-zinc-200 lg:flex">
      <section className={cn(mode !== "documentos" && "opacity-55")}>
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          Documentos base
        </h2>
        <ul className="mt-4 space-y-3">
          {docsVisibles.slice(0, 8).map((doc) => (
            <li key={doc.id_documento} className="flex items-start gap-2 text-xs font-semibold text-zinc-300">
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <span className="leading-tight">
                {doc.titulo}
                {doc.estado !== "indexado" && doc.id_documento > 0 && (
                  <span className="mt-1 block text-[10px] font-medium text-amber-400">
                    {doc.estado}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
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
            <p className="text-xs text-zinc-500">Sin conversaciones aún.</p>
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
