"use client";

import { RefreshCw } from "lucide-react";

import { type TemaChat } from "@/lib/api";
import { cn } from "@/lib/utils";

const TEMAS_FALLBACK: TemaChat[] = [
  { id_categoria: 1, nombre: "matricula", descripcion: "Procesos de matrícula", documentos_count: 0 },
  { id_categoria: 2, nombre: "silabo", descripcion: "Sílabos y currículas", documentos_count: 0 },
  { id_categoria: 3, nombre: "tramites", descripcion: "Trámites académicos", documentos_count: 0 },
  { id_categoria: 4, nombre: "bienestar", descripcion: "Bienestar universitario", documentos_count: 0 },
];

type Props = {
  temas: TemaChat[];
  selectedTema: TemaChat | null;
  onSelectTema: (tema: TemaChat | null) => void;
};

function labelTema(tema: TemaChat) {
  const fixed: Record<string, string> = {
    matricula: "Matrícula",
    silabo: "Sílabos",
    tramites: "Trámites",
    bienestar: "Bienestar",
  };
  if (fixed[tema.nombre]) return fixed[tema.nombre];
  const raw = tema.descripcion || tema.nombre;
  return raw
    .split(",")[0]
    .split(" ")
    .slice(0, 2)
    .join(" ")
    .replace(/^./, (c) => c.toUpperCase());
}

export function ChatHeader({ temas, selectedTema, onSelectTema }: Props) {
  const prioridad = ["matricula", "silabo", "tramites", "bienestar"];
  const ordenados = [...temas].sort((a, b) => {
    const ai = prioridad.indexOf(a.nombre);
    const bi = prioridad.indexOf(b.nombre);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return b.documentos_count - a.documentos_count || a.nombre.localeCompare(b.nombre);
  });
  const visibles = ordenados.length > 0 ? ordenados.slice(0, 6) : TEMAS_FALLBACK;

  return (
    <header className="border-b border-chat-line bg-chat-shell px-4 py-3 text-white">
      <div className="mb-4 flex h-8 items-center gap-3 rounded-lg bg-[#242422] px-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#565653]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#565653]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#565653]" />
        </div>
        <div className="min-w-0 flex-1 rounded-md bg-[#20201e] px-3 py-1 text-xs font-semibold text-zinc-300">
          https://ChatUNTSistemas.com/chat
        </div>
        <RefreshCw className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-lg font-bold leading-none text-zinc-100">
            Asistente UNT Sistemas
          </h1>
          <div className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-emerald-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            En línea · documentos actualizados
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold text-zinc-400">Tema:</span>
          {visibles.map((tema) => {
            const active = selectedTema?.id_categoria === tema.id_categoria;
            return (
              <button
                key={tema.id_categoria}
                type="button"
                onClick={() => onSelectTema(active ? null : tema)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs font-semibold transition",
                  active
                    ? "border-chat-primary bg-chat-primary text-white"
                    : "border-zinc-500/70 bg-transparent text-zinc-400 hover:border-zinc-300 hover:text-zinc-100",
                )}
                title={
                  tema.documentos_count > 0
                    ? `${tema.documentos_count} documento(s) indexado(s)`
                    : "Tema disponible para consulta general"
                }
              >
                {labelTema(tema)}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
