"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, Paperclip, Send } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  onSend: (texto: string) => void | Promise<void>;
  onAttach?: (file: File) => void | Promise<void>;
  disabled?: boolean;
};

export function CajaPregunta({ onSend, onAttach, disabled }: Props) {
  const [texto, setTexto] = useState("");
  const [grabando, setGrabando] = useState(false);
  const [soportaVoz, setSoportaVoz] = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const enviar = async () => {
    const t = texto.trim();
    if (!t || disabled) return;
    setTexto("");
    await onSend(t);
    inputRef.current?.focus();
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
    <div className="border-t border-chat-line bg-chat-shell px-4 pb-3 pt-4">
      <div className="mx-auto max-w-3xl">
        <div className="flex h-12 items-center gap-2 rounded-full border border-zinc-600 bg-[#222220] px-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] transition focus-within:border-zinc-400">
          <input
            ref={inputRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                enviar();
              }
            }}
            placeholder="Escribe tu consulta académica..."
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          {soportaVoz && (
            <button
              type="button"
              onClick={toggleVoz}
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100",
                grabando && "bg-red-500 text-white hover:bg-red-600",
              )}
              aria-label={grabando ? "Detener grabación" : "Grabar voz"}
              title={grabando ? "Detener" : "Hablar"}
            >
              {grabando ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
            aria-label="Adjuntar archivo"
            title="Adjuntar"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) await onAttach?.(file);
              e.currentTarget.value = "";
            }}
          />
          <button
            type="button"
            onClick={enviar}
            disabled={disabled || !texto.trim()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-chat-primary text-white transition hover:bg-chat-primarySoft disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Enviar"
          >
            {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] font-semibold text-zinc-500">
          Respuestas basadas en documentos oficiales de la UNT
        </p>
      </div>
    </div>
  );
}
