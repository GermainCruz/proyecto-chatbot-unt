"use client";

import { useState } from "react";
import { Bot, ChevronDown, Copy, ThumbsDown, ThumbsUp, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { api, type Mensaje } from "@/lib/api";
import { cn } from "@/lib/utils";

type Props = {
  mensaje: Mensaje;
  onFeedback?: (id: number, util: number) => void;
};

export function MensajeBurbuja({ mensaje, onFeedback }: Props) {
  const [util, setUtil] = useState<number | null>(mensaje.util ?? null);
  const [showFuentes, setShowFuentes] = useState(false);
  const isUser = mensaje.rol === "user";

  const fuentes = mensaje.fuentes ?? [];

  const handleVote = async (valor: number) => {
    const nuevo = util === valor ? 0 : valor;
    setUtil(nuevo);
    try {
      await api.post(`/chat/mensajes/${mensaje.id_mensaje}/feedback`, { util: nuevo });
      onFeedback?.(mensaje.id_mensaje, nuevo);
    } catch {
      setUtil(util);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(mensaje.contenido);
  };

  return (
    <div className={cn("flex gap-3 animate-fade-in", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-full text-white shadow-sm",
          isUser ? "bg-unt-gold-600" : "bg-unt-blue-700",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-unt-blue-700 text-white"
            : "bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800",
        )}
      >
        <div className={cn("markdown-body text-sm", isUser && "text-white")}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{mensaje.contenido}</ReactMarkdown>
        </div>

        {!isUser && fuentes.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowFuentes((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium text-unt-blue-700 hover:underline dark:text-unt-blue-300"
            >
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", showFuentes && "rotate-180")}
              />
              {showFuentes ? "Ocultar" : "Ver"} {fuentes.length} fuente{fuentes.length > 1 ? "s" : ""}
            </button>
            {showFuentes && (
              <ul className="mt-2 space-y-1">
                {fuentes.map((f) => (
                  <li
                    key={f.id_fragmento}
                    className="rounded-md bg-slate-50 px-2 py-1 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    📄 {f.titulo}
                    {f.pagina ? `, p. ${f.pagina}` : ""}
                    <span className="ml-2 text-slate-400">score: {f.score.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!isUser && (
          <div className="mt-2 flex items-center gap-1 text-slate-400">
            <button
              onClick={copy}
              className="rounded p-1 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              aria-label="Copiar respuesta"
              title="Copiar"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleVote(1)}
              className={cn(
                "rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800",
                util === 1 && "text-emerald-600",
              )}
              aria-label="Útil"
              title="Útil"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleVote(-1)}
              className={cn(
                "rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800",
                util === -1 && "text-red-500",
              )}
              aria-label="No útil"
              title="No útil"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
