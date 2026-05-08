"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Sparkles } from "lucide-react";

import { CajaPregunta } from "@/components/CajaPregunta";
import { MensajeBurbuja } from "@/components/MensajeBurbuja";
import { Sidebar } from "@/components/Sidebar";
import {
  api,
  type Conversacion,
  type ConversacionDetalle,
  type Mensaje,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const SUGERENCIAS = [
  "¿Dónde quedan los laboratorios?",
  "¿Qué necesito para prestar un libro de la biblioteca?",
  "¿Cómo recupero mi correo @unitru.edu.pe?",
  "¿Qué nivel de inglés necesito para sacar mi bachiller?",
  "¿A partir de qué ciclo me exigen prácticas?",
  "¿Cómo puedo adelantar un curso?",
];

export default function ChatPage() {
  const { user, loading: loadingUser } = useAuth();
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [activa, setActiva] = useState<ConversacionDetalle | null>(null);
  const [enviando, setEnviando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const cargarConversaciones = useCallback(async () => {
    try {
      const lista = await api.get<Conversacion[]>("/chat/conversaciones");
      setConversaciones(lista);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    if (!loadingUser && user) cargarConversaciones();
  }, [loadingUser, user, cargarConversaciones]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activa?.mensajes?.length, enviando]);

  const seleccionar = async (id: string) => {
    try {
      const detalle = await api.get<ConversacionDetalle>(`/chat/conversaciones/${id}`);
      setActiva(detalle);
    } catch {
      /* noop */
    }
  };

  const nuevoChat = async () => {
    const conv = await api.post<Conversacion>("/chat/conversaciones", {});
    await cargarConversaciones();
    await seleccionar(conv.id_conversacion);
  };

  const eliminar = async (id: string) => {
    await api.delete(`/chat/conversaciones/${id}`);
    if (activa?.id_conversacion === id) setActiva(null);
    await cargarConversaciones();
  };

  const enviarPregunta = async (texto: string) => {
    let conv = activa;
    if (!conv) {
      const nueva = await api.post<Conversacion>("/chat/conversaciones", {});
      conv = { ...nueva, mensajes: [] };
      setActiva(conv);
    }

    const optimistico: Mensaje = {
      id_mensaje: -Date.now(),
      rol: "user",
      contenido: texto,
      fuentes: null,
      util: null,
      creado_en: new Date().toISOString(),
    };
    setActiva({ ...conv, mensajes: [...(conv.mensajes ?? []), optimistico] });
    setEnviando(true);

    try {
      const res = await api.post<{
        id_mensaje_usuario: number;
        id_mensaje_asistente: number;
        contenido: string;
        fuentes: { id_fragmento: number; titulo: string; pagina: number | null; score: number }[];
        latencia_ms: number;
      }>(`/chat/conversaciones/${conv.id_conversacion}/mensajes`, { pregunta: texto });

      const detalle = await api.get<ConversacionDetalle>(
        `/chat/conversaciones/${conv.id_conversacion}`,
      );
      setActiva(detalle);
      cargarConversaciones();
    } catch (err: any) {
      const errorMsg: Mensaje = {
        id_mensaje: -Date.now(),
        rol: "assistant",
        contenido:
          "⚠️ Ocurrió un error al procesar tu pregunta. Intenta nuevamente en unos segundos.",
        fuentes: null,
        util: null,
        creado_en: new Date().toISOString(),
      };
      setActiva((prev) =>
        prev ? { ...prev, mensajes: [...prev.mensajes, errorMsg] } : prev,
      );
    } finally {
      setEnviando(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="grid h-screen place-items-center text-slate-500">Cargando…</div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        conversaciones={conversaciones}
        activeId={activa?.id_conversacion ?? null}
        onSelect={seleccionar}
        onNew={nuevoChat}
        onDelete={eliminar}
        onRefresh={cargarConversaciones}
      />

      <main className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-unt-blue-700" />
            <h1 className="text-base font-semibold">
              {activa?.titulo || "UNT Bot"}
            </h1>
          </div>
          <span className="text-xs text-slate-400">{user?.correo}</span>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
            {!activa || activa.mensajes.length === 0 ? (
              <div className="mt-8 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-unt-blue-700 to-unt-blue-900 text-unt-gold-400 shadow-soft">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-unt-blue-900 dark:text-unt-blue-100">
                  Hola{user ? `, ${user.nombre_completo.split(" ")[0]}` : ""} 👋
                </h2>
                <p className="mt-1 text-slate-500">
                  ¿En qué puedo ayudarte hoy? Empieza con una de estas preguntas:
                </p>
                <div className="mx-auto mt-6 grid max-w-2xl gap-2 sm:grid-cols-2">
                  {SUGERENCIAS.map((s) => (
                    <button
                      key={s}
                      onClick={() => enviarPregunta(s)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition hover:border-unt-blue-500 hover:bg-unt-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-unt-blue-800/30"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              activa.mensajes.map((m) => (
                <MensajeBurbuja key={m.id_mensaje} mensaje={m} />
              ))
            )}

            {enviando && (
              <div className="flex items-center gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-unt-blue-700 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 dark:bg-slate-900 dark:border-slate-800">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:0.2s]" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <CajaPregunta onSend={enviarPregunta} disabled={enviando} />
      </main>
    </div>
  );
}
