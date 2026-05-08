"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, Send } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  onSend: (texto: string) => void | Promise<void>;
  disabled?: boolean;
};

export function CajaPregunta({ onSend, disabled }: Props) {
  const [texto, setTexto] = useState("");
  const [grabando, setGrabando] = useState(false);
  const [soportaVoz, setSoportaVoz] = useState(false);
  const recognitionRef = useRef<any>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      setSoportaVoz(true);
      const r = new SR();
      r.lang = "es-PE";
      r.continuous = false;
      r.interimResults = true;
      r.onresult = (ev: any) => {
        let parcial = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          parcial += ev.results[i][0].transcript;
        }
        setTexto((prev) => (prev ? prev + " " : "") + parcial);
      };
      r.onend = () => setGrabando(false);
      r.onerror = () => setGrabando(false);
      recognitionRef.current = r;
    }
  }, []);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [texto]);

  const enviar = async () => {
    const t = texto.trim();
    if (!t || disabled) return;
    setTexto("");
    await onSend(t);
  };

  const toggleVoz = () => {
    if (!recognitionRef.current) return;
    if (grabando) {
      recognitionRef.current.stop();
      setGrabando(false);
    } else {
      try {
        recognitionRef.current.start();
        setGrabando(true);
      } catch {
        /* noop */
      }
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white/80 backdrop-blur p-3 dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto max-w-3xl">
        <div
          className={cn(
            "flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-soft transition focus-within:border-unt-blue-500 focus-within:ring-2 focus-within:ring-unt-blue-500/30 dark:border-slate-700 dark:bg-slate-900",
          )}
        >
          {soportaVoz && (
            <button
              type="button"
              onClick={toggleVoz}
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
                grabando && "bg-red-500 text-white hover:bg-red-600",
              )}
              aria-label={grabando ? "Detener grabación" : "Grabar voz"}
              title={grabando ? "Detener" : "Hablar"}
            >
              {grabando ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}
          <textarea
            ref={taRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar();
              }
            }}
            placeholder="Pregúntale a UNT Bot…"
            rows={1}
            className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm focus:outline-none"
          />
          <button
            onClick={enviar}
            disabled={disabled || !texto.trim()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-unt-blue-700 text-white hover:bg-unt-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Enviar"
          >
            {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1.5 text-center text-[11px] text-slate-400">
          UNT Bot solo responde con base en documentos oficiales cargados por el equipo.
        </p>
      </div>
    </div>
  );
}
