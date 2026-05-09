"use client";

import { useState } from "react";
import {
  Bot,
  ChevronDown,
  Copy,
  FileText,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { api, type Mensaje } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

type Props = {
  mensaje: Mensaje;
  onFeedback?: (id: number, util: number) => void;
};

export function MensajeBurbuja({ mensaje, onFeedback }: Props) {
  const { user } = useAuth();
  const [util, setUtil] = useState<number | null>(mensaje.util ?? null);
  const [showFuentes, setShowFuentes] = useState(false);
  const isUser = mensaje.rol === "user";
  const fuentes = mensaje.fuentes ?? [];
  const canUseActions = !isUser && mensaje.id_mensaje > 0;

  const handleVote = async (valor: number) => {
    if (!canUseActions) return;
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
    <div className={cn("flex animate-fade-in gap-3", isUser && "justify-end")}>
      {!isUser && (
        <div className="mt-1 hidden h-8 w-8 shrink-0 place-items-center rounded-full bg-chat-primary text-white sm:grid">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[min(84%,620px)] px-4 py-3 text-sm font-semibold leading-relaxed shadow-sm",
          isUser
            ? "querybot-user-message rounded-2xl rounded-br-sm border border-zinc-600 bg-[#252523] text-zinc-100"
            : "rounded-2xl rounded-tl-sm bg-chat-primary text-white",
        )}
      >
        <div className={cn("markdown-body", isUser ? "querybot-user-message text-zinc-100" : "text-white")}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{mensaje.contenido}</ReactMarkdown>
        </div>

        {!isUser && fuentes.length > 0 && (
          <div className="mt-3 border-t border-white/15 pt-2">
            <button
              type="button"
              onClick={() => setShowFuentes((v) => !v)}
              className="flex items-center gap-1 text-xs font-bold text-chat-gold transition hover:text-white"
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
                    className="rounded-md bg-white/10 px-2 py-1 text-[11px] text-white/85"
                  >
                    <FileText className="mr-1 inline h-3 w-3" />
                    {f.titulo}
                    {f.pagina ? `, p. ${f.pagina}` : ""}
                    <span className="ml-2 text-white/45">score: {f.score.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {canUseActions && (
          <div className="mt-2 flex items-center gap-1 text-white/55">
            <button
              type="button"
              onClick={copy}
              className="rounded p-1 transition hover:bg-white/10 hover:text-white"
              aria-label="Copiar respuesta"
              title="Copiar"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleVote(1)}
              className={cn(
                "rounded p-1 transition hover:bg-white/10 hover:text-white",
                util === 1 && "text-emerald-300",
              )}
              aria-label="Útil"
              title="Útil"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleVote(-1)}
              className={cn(
                "rounded p-1 transition hover:bg-white/10 hover:text-white",
                util === -1 && "text-red-300",
              )}
              aria-label="No útil"
              title="No útil"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-chat-gold text-sm font-bold text-chat-primary">
          {user?.nombre_completo?.[0]?.toUpperCase() || "U"}
        </div>
      )}
    </div>
  );
}
