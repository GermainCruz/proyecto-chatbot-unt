"use client";

import { useState } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { type TemaChat } from "@/lib/api";
import { cn } from "@/lib/utils";

// Coloca una imagen decorativa o mascota en `frontend/public/querybot-header.png`.
const HEADER_IMAGE_SRC = "/querybot-header.png";

const TEMAS_FALLBACK: TemaChat[] = [
  { id_categoria: 1, nombre: "matricula", descripcion: "Procesos de matricula", documentos_count: 0 },
  { id_categoria: 2, nombre: "silabo", descripcion: "Silabos y curriculas", documentos_count: 0 },
  { id_categoria: 3, nombre: "tramites", descripcion: "Tramites academicos", documentos_count: 0 },
  { id_categoria: 4, nombre: "bienestar", descripcion: "Bienestar universitario", documentos_count: 0 },
];

type Props = {
  temas: TemaChat[];
  selectedTema: TemaChat | null;
  temasDisabled?: boolean;
  onSelectTema: (tema: TemaChat | null) => void;
};

function labelTema(tema: TemaChat) {
  const fixed: Record<string, string> = {
    matricula: "Matricula",
    silabo: "Silabos",
    tramites: "Tramites",
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

export function ChatHeader({ temas, selectedTema, temasDisabled, onSelectTema }: Props) {
  const [imageError, setImageError] = useState(false);
  const prioridad = ["matricula", "silabo", "tramites", "bienestar"];
  const ordenados = [...temas].sort((a, b) => {
    const ai = prioridad.indexOf(a.nombre);
    const bi = prioridad.indexOf(b.nombre);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return b.documentos_count - a.documentos_count || a.nombre.localeCompare(b.nombre);
  });
  const visibles = ordenados.length > 0 ? ordenados.slice(0, 6) : TEMAS_FALLBACK;

  return (
    <header className="border-b border-chat-line bg-chat-shell px-5 py-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-zinc-700 bg-[#242422]">
            {!imageError ? (
              <img
                src={HEADER_IMAGE_SRC}
                alt="Imagen QueryBot"
                className="h-full w-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-lg font-black text-chat-gold">QB</span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none text-zinc-100">QueryBot</h1>
            <div className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-emerald-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              En linea · base documental conectada
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle variant="chat" className="mr-1" />
          <span className="mr-1 text-xs font-semibold text-zinc-400">Tema:</span>
          {visibles.map((tema) => {
            const active = selectedTema?.id_categoria === tema.id_categoria;
            return (
              <button
                key={tema.id_categoria}
                type="button"
                disabled={temasDisabled}
                onClick={() => onSelectTema(active ? null : tema)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45",
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
