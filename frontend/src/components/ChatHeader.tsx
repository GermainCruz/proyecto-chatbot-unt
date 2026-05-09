"use client";

import { RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";

const TEMAS = ["Matrícula", "Sílabos", "Trámites", "Bienestar"];

type Props = {
  selectedTema: string | null;
  onSelectTema: (tema: string | null) => void;
};

export function ChatHeader({ selectedTema, onSelectTema }: Props) {
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
          {TEMAS.map((tema) => {
            const active = selectedTema === tema;
            return (
              <button
                key={tema}
                type="button"
                onClick={() => onSelectTema(active ? null : tema)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs font-semibold transition",
                  active
                    ? "border-chat-primary bg-chat-primary text-white"
                    : "border-zinc-500/70 bg-transparent text-zinc-400 hover:border-zinc-300 hover:text-zinc-100",
                )}
              >
                {tema}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
