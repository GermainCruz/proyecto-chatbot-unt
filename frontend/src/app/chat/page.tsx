"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot } from "lucide-react";

import { CajaPregunta } from "@/components/CajaPregunta";
import { ChatHeader } from "@/components/ChatHeader";
import { MensajeBurbuja } from "@/components/MensajeBurbuja";
import { RightPanel } from "@/components/RightPanel";
import { Sidebar } from "@/components/Sidebar";
import {
  api,
  type Conversacion,
  type ConversacionDetalle,
  type Mensaje,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function ChatPage() {
  const { user, loading: loadingUser } = useAuth();
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [activa, setActiva] = useState<ConversacionDetalle | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [selectedTema, setSelectedTema] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const nombre = user?.nombre_completo?.split(" ")[0] || "estudiante";

  const bienvenida = useMemo<Mensaje>(
    () => ({
      id_mensaje: 0,
      rol: "assistant",
      contenido: `Hola ${nombre}, soy tu asistente académico 👋\n\nPuedo ayudarte con: Matrícula, Sílabos, Trámites, Bienestar. Selecciona un tema o escribe tu consulta.`,
      fuentes: null,
      util: null,
      creado_en: new Date().toISOString(),
    }),
    [nombre],
  );

  const mensajes = activa?.mensajes?.length ? activa.mensajes : [bienvenida];

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
  }, [mensajes.length, enviando]);

  const seleccionar = async (id: string) => {
    try {
      const detalle = await api.get<ConversacionDetalle>(`/chat/conversaciones/${id}`);
      setActiva(detalle);
    } catch {
      /* noop */
    }
  };

  const nuevoChat = () => {
    setActiva(null);
    setSelectedTema(null);
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
      await api.post<{
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
    } catch {
      const errorMsg: Mensaje = {
        id_mensaje: -Date.now(),
        rol: "assistant",
        contenido:
          "Ocurrió un error al procesar tu pregunta. Intenta nuevamente en unos segundos.",
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
      <div className="grid h-screen place-items-center bg-chat-shell text-sm font-semibold text-zinc-400">
        Cargando...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-chat-shell text-zinc-100">
      <Sidebar
        conversaciones={conversaciones}
        activeId={activa?.id_conversacion ?? null}
        onSelect={seleccionar}
        onNew={nuevoChat}
        onDelete={eliminar}
        onRefresh={cargarConversaciones}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <ChatHeader selectedTema={selectedTema} onSelectTema={setSelectedTema} />

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 py-4">
            <div className="mb-5 flex items-center gap-3 text-xs font-semibold text-zinc-500">
              <span className="h-px flex-1 bg-chat-line" />
              Hoy
              <span className="h-px flex-1 bg-chat-line" />
            </div>

            <div className="flex-1 space-y-4">
              {mensajes.map((m) => (
                <MensajeBurbuja key={m.id_mensaje} mensaje={m} />
              ))}

              {enviando && (
                <div className="flex items-center gap-3">
                  <div className="hidden h-8 w-8 place-items-center rounded-full bg-chat-primary text-white sm:grid">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-chat-primary px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-white/70" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-white/70 [animation-delay:0.2s]" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-white/70 [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <CajaPregunta onSend={enviarPregunta} disabled={enviando} />
      </main>

      <RightPanel
        conversaciones={conversaciones}
        activeId={activa?.id_conversacion ?? null}
        onSelect={seleccionar}
        onNew={nuevoChat}
        onDelete={eliminar}
      />
    </div>
  );
}
