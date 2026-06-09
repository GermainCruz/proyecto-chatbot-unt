"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, ChevronDown } from "lucide-react";

import { CajaPregunta } from "@/components/CajaPregunta";
import { ChatHeader } from "@/components/ChatHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MensajeBurbuja } from "@/components/MensajeBurbuja";
import { RightPanel } from "@/components/RightPanel";
import { Sidebar } from "@/components/Sidebar";
import {
  api,
  type Conversacion,
  type ConversacionDetalle,
  type DocumentoBase,
  type Mensaje,
  type TemaChat,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

const COPY_TEMA: Record<string, string> = {
  matricula:
    "Genial, elegiste Matricula. Vamos paso a paso: puedes preguntarme por requisitos, fechas, cursos disponibles, creditos o problemas frecuentes. Estoy listo para revisar la base documental contigo.",
  silabo:
    "Perfecto, abrimos el mundo de Silabos. Preguntame por competencias, unidades, evaluacion, bibliografia o datos de algun curso especifico.",
  tramites:
    "Listo, modo Tramites activado. Dime que proceso quieres resolver y lo ordenamos sin drama: requisitos, pasos, oficinas, plazos o documentos necesarios.",
  bienestar:
    "Buena eleccion: Bienestar. Puedes preguntarme por comedor, salud, apoyo estudiantil, actividades o requisitos de atencion. Vamos a ubicar la informacion util.",
};

const FAQS = [
  {
    titulo: "Matrícula",
    keywords: ["matricula"],
    preguntas: [
      "¿Cuándo me toca matricularme según mi facultad?",
      "¿Cómo me matriculo si jalé un curso?",
      "¿Puedo modificar mi matrícula ya registrada?",
      "¿Cuánto cuesta rectificar cursos o cambiar sección?",
      "¿Qué pasa si desapruebo un curso tres veces?",
    ],
  },
  {
    titulo: "Postulación al comedor",
    keywords: ["comedor"],
    preguntas: [
      "¿Cuáles son los requisitos para el comedor?",
      "¿Qué documentos de ingresos debo presentar?",
      "¿Puedo postular si tengo beca Pronabec?",
      "¿Qué promedio necesito para el comedor?",
      "¿Dónde realizo el registro virtual para postular?",
    ],
  },
  {
    titulo: "Gym UNT",
    keywords: ["gym", "gimnasio"],
    preguntas: [
      "¿Dónde queda el gimnasio de la UNT?",
      "¿Qué requisitos piden para entrar al gimnasio?",
      "¿Cuáles son los horarios de atención disponibles?",
      "¿Cómo me inscribo para ir a entrenar?",
      "¿Cuántas veces por semana puedo asistir?",
    ],
  },
  {
    titulo: "Carné universitario",
    keywords: ["carne"],
    preguntas: [
      "¿Cómo solicito el carné universitario por internet?",
      "¿Cuánto cuesta el trámite del carné universitario?",
      "¿Qué hago si perdí mi carné universitario?",
      "¿Cómo debe ser la foto del carné?",
      "¿Qué significa que mi trámite esté observado?",
    ],
  },
  {
    titulo: "Certificado de estudios",
    keywords: ["certificado"],
    preguntas: [
      "¿Cómo se tramita el certificado de estudios?",
      "¿Cuánto cuesta el certificado de estudios UNT?",
      "¿Qué requisitos necesito para el certificado?",
      "¿Cómo sé si mi pago fue validado?",
      "¿Cómo corrijo un documento rechazado o pendiente?",
    ],
  },
  {
    titulo: "Elaboración de carpeta URA",
    keywords: ["carpeta", "ura"],
    preguntas: [
      "¿Para qué grados aplica la elaboración de carpeta?",
      "¿Qué requisitos necesito para armar mi carpeta?",
      "¿Dónde puedo realizar el pago del trámite?",
      "¿Qué es la fecha de colación del formulario?",
      "¿Cómo soluciono una observación en mi carpeta?",
    ],
  },
] as const;

function normalizarTema(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

type MensajeUI = Mensaje & { variant?: "normal" | "error" };

function crearMensajeUI(contenido: string, variant: "normal" | "error" = "normal"): MensajeUI {
  return {
    id_mensaje: -Date.now(),
    rol: "assistant",
    contenido,
    fuentes: null,
    util: null,
    creado_en: new Date().toISOString(),
    variant,
  };
}

export default function ChatPage() {
  const { user, loading: loadingUser } = useAuth();
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [temas, setTemas] = useState<TemaChat[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoBase[]>([]);
  const [activa, setActiva] = useState<ConversacionDetalle | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [selectedTema, setSelectedTema] = useState<TemaChat | null>(null);
  const [mensajeTema, setMensajeTema] = useState<Mensaje | null>(null);
  const [panelMode, setPanelMode] = useState<"documentos" | "historial">("historial");
  const [panelSearch, setPanelSearch] = useState("");
  const [temasPorConversacion, setTemasPorConversacion] = useState<Record<string, string>>({});
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const { theme } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [faqOpen, setFaqOpen] = useState(true);

  const nombre = user?.nombre_completo?.split(" ")[0] || "estudiante";

  const bienvenida = useMemo<Mensaje>(
    () => ({
      id_mensaje: 0,
      rol: "assistant",
      contenido: `Hola ${nombre}, soy QueryBot.\n\nPuedes escribir una consulta general de inmediato. Si tu duda pertenece a un proceso especifico, elige primero un tema para que el chat quede organizado desde el inicio.`,
      fuentes: null,
      util: null,
      creado_en: new Date().toISOString(),
    }),
    [nombre],
  );

  const mensajes = activa?.mensajes?.length
    ? activa.mensajes
    : [mensajeTema ?? bienvenida];
  const temasBloqueados = Boolean(activa?.mensajes?.length);
  const canNewChat = temasBloqueados;

  const faqGrupo = useMemo(() => {
    if (!selectedTema) return null;
    const t = normalizarTema(selectedTema.descripcion || selectedTema.nombre || "");
    return (
      FAQS.find((g) => g.keywords.some((k) => t.includes(k))) ??
      FAQS.find((g) => t.includes(normalizarTema(g.titulo)))
    );
  }, [selectedTema]);
  const conversacionesVisibles = conversaciones.filter((conv) => !conv.archivada);
  const conversacionesArchivadas = conversaciones.filter((conv) => conv.archivada);

  const cargarConversaciones = useCallback(async () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("querybot_archived_chats");
      }
      const lista = await api.get<Conversacion[]>("/chat/conversaciones");
      setConversaciones(lista);
    } catch {
      /* noop */
    }
  }, []);

  const cargarBaseChat = useCallback(async () => {
    try {
      const [t, d] = await Promise.all([
        api.get<TemaChat[]>("/chat/temas"),
        api.get<DocumentoBase[]>("/chat/documentos-base"),
      ]);
      setTemas(t);
      setDocumentos(d);
    } catch {
      /* La UI mantiene temas de respaldo si la API no responde. */
    }
  }, []);

  useEffect(() => {
    if (!loadingUser && user) {
      cargarConversaciones();
      cargarBaseChat();
      const stored = window.localStorage.getItem("querybot_temas_conversacion");
      if (stored) setTemasPorConversacion(JSON.parse(stored));
    }
  }, [loadingUser, user, cargarConversaciones, cargarBaseChat]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [mensajes.length, enviando, subiendoArchivo]);

  const guardarTemaConversacion = (id: string, tema: TemaChat | null) => {
    if (!tema) return;
    const label = tema.descripcion || tema.nombre;
    setTemasPorConversacion((prev) => {
      const next = { ...prev, [id]: label };
      window.localStorage.setItem("querybot_temas_conversacion", JSON.stringify(next));
      return next;
    });
  };

  const seleccionar = async (id: string) => {
    try {
      const detalle = await api.get<ConversacionDetalle>(`/chat/conversaciones/${id}`);
      setActiva(detalle);
      setMensajeTema(null);
      const etiqueta = temasPorConversacion[id];
      if (!etiqueta) {
        setSelectedTema(null);
      } else {
        const norm = normalizarTema(etiqueta);
        const temaConv =
          temas.find((t) => normalizarTema(t.descripcion || t.nombre || "") === norm) ||
          temas.find((t) => normalizarTema(t.nombre) === norm) ||
          temas.find((t) => normalizarTema(t.descripcion || "") === norm);
        setSelectedTema(temaConv ?? null);
      }
      setPanelMode("historial");
    } catch {
      /* noop */
    }
  };

  const nuevoChat = () => {
    setActiva(null);
    setSelectedTema(null);
    setMensajeTema(null);
    setPanelSearch("");
  };

  const seleccionarTema = (tema: TemaChat | null) => {
    setSelectedTema(tema);
    if (!tema) {
      setMensajeTema(null);
      return;
    }

    const clave = normalizarTema(tema.nombre);
    const copy =
      COPY_TEMA[clave] ||
      `Excelente, seleccionaste "${tema.descripcion || tema.nombre}". Haz tu consulta y buscare la respuesta mas util en los documentos disponibles.`;
    const detalleDocs =
      tema.documentos_count > 0
        ? `\n\nActualmente tengo ${tema.documentos_count} documento(s) indexado(s) para este tema.`
        : "\n\nAun no hay documentos indexados para este tema, pero puedo orientarte si hay informacion general cargada.";

    setMensajeTema(crearMensajeUI(`${copy}${detalleDocs}`));
  };

  const eliminar = async (id: string) => {
    await api.delete(`/chat/conversaciones/${id}`);
    if (activa?.id_conversacion === id) setActiva(null);
    await cargarConversaciones();
  };

  const archivar = async (id: string) => {
    try {
      await api.patch<Conversacion>(`/chat/conversaciones/${id}`, { archivada: true });
      setConversaciones((prev) =>
        prev.map((c) => (c.id_conversacion === id ? { ...c, archivada: true } : c)),
      );
      if (activa?.id_conversacion === id) setActiva(null);
    } catch {
      /* noop */
    }
  };

  const restaurarArchivado = async (id: string) => {
    try {
      await api.patch<Conversacion>(`/chat/conversaciones/${id}`, { archivada: false });
      setConversaciones((prev) =>
        prev.map((c) => (c.id_conversacion === id ? { ...c, archivada: false } : c)),
      );
    } catch {
      /* noop */
    }
  };

  const exportarChats = () => {
    const data = JSON.stringify({ conversaciones, temasPorConversacion }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "querybot-chats.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const eliminarTodosLosChats = async () => {
    await Promise.all(conversaciones.map((conv) => api.delete(`/chat/conversaciones/${conv.id_conversacion}`)));
    setActiva(null);
    setConversaciones([]);
    setTemasPorConversacion({});
    window.localStorage.removeItem("querybot_temas_conversacion");
    await cargarConversaciones();
  };

  const adjuntarArchivo = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setMensajeTema(crearMensajeUI("Por ahora solo puedo recibir archivos PDF para alimentar la base documental."));
      return;
    }

    if (user?.rol !== "administrador") {
      setMensajeTema(
        crearMensajeUI(
          `Seleccionaste "${file.name}", pero la carga de documentos base esta reservada para administradores. Si ese archivo debe alimentar a QueryBot, subelo desde una cuenta admin o desde el panel de documentos.`,
        ),
      );
      setPanelMode("documentos");
      return;
    }

    setSubiendoArchivo(true);
    setMensajeTema(
      crearMensajeUI(
        `Estoy subiendo "${file.name}" a la base documental. Cuando termine de indexarse, QueryBot podra usarlo como fuente.`,
      ),
    );

    try {
      const fd = new FormData();
      fd.append("titulo", file.name.replace(/\.pdf$/i, ""));
      if (selectedTema) fd.append("id_categoria", String(selectedTema.id_categoria));
      fd.append("archivo", file);
      await api.upload("/admin/documentos", fd);
      await cargarBaseChat();
      setPanelMode("documentos");
      setMensajeTema(
        crearMensajeUI(
          `Documento recibido: "${file.name}". Lo deje en proceso de indexacion; en unos momentos aparecera actualizado en Documentos base.`,
        ),
      );
    } catch {
      setMensajeTema(
        crearMensajeUI(
          `No pude subir "${file.name}". Revisa que sea PDF, que no este duplicado y que pese menos de 25 MB.`,
        ),
      );
    } finally {
      setSubiendoArchivo(false);
    }
  };

  const enviarPregunta = async (texto: string) => {
    let conv = activa;
    if (!conv) {
      const nueva = await api.post<Conversacion>("/chat/conversaciones", {});
      conv = { ...nueva, mensajes: [] };
      setActiva(conv);
      guardarTemaConversacion(conv.id_conversacion, selectedTema);
    }

    const optimistico: Mensaje = {
      id_mensaje: -Date.now(),
      rol: "user",
      contenido: texto,
      fuentes: null,
      util: null,
      creado_en: new Date().toISOString(),
    };
    setMensajeTema(null);
    setActiva({ ...conv, mensajes: [...(conv.mensajes ?? []), optimistico] });
    setEnviando(true);

    try {
      await api.post<{
        id_mensaje_usuario: number;
        id_mensaje_asistente: number;
        contenido: string;
        fuentes: { id_fragmento: number; titulo: string; pagina: number | null; score: number }[];
        latencia_ms: number;
      }>(`/chat/conversaciones/${conv.id_conversacion}/mensajes`, {
        pregunta: texto,
        id_categoria: selectedTema?.id_categoria ?? null,
      });

      const detalle = await api.get<ConversacionDetalle>(
        `/chat/conversaciones/${conv.id_conversacion}`,
      );
      setActiva(detalle);
      cargarConversaciones();
    } catch (err) {
      const detalle =
        err instanceof Error ? err.message : "Error de conexion con el servidor.";
      const errorMsg = crearMensajeUI(
        `**No pude procesar tu pregunta**\n\n${detalle}\n\n` +
          "Comprueba que el backend este activo y, si usas Gemini, que `GOOGLE_API_KEY` en `.env` sea valida. Si el problema continua, revisa los logs del backend.",
        "error",
      );
      setActiva((prev) =>
        prev ? { ...prev, mensajes: [...(prev.mensajes ?? []), errorMsg] } : prev,
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
    <div className={`querybot-${theme} flex h-screen overflow-hidden bg-chat-shell text-zinc-100`}>
      <Sidebar
        conversaciones={conversacionesVisibles}
        activeId={activa?.id_conversacion ?? null}
        onSelect={seleccionar}
        onNew={nuevoChat}
        onDelete={eliminar}
        onRefresh={cargarConversaciones}
        onExportChats={exportarChats}
        onDeleteAllChats={() => setConfirmDeleteAll(true)}
        canNewChat={canNewChat}
        archivedChats={conversacionesArchivadas}
        onSelectArchived={seleccionar}
        onRestoreArchived={restaurarArchivado}
        onNavigate={(mode) => {
          setPanelMode(mode === "documentos" ? "documentos" : "historial");
          if (mode === "buscar") setPanelSearch("");
        }}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          temas={temas}
          selectedTema={selectedTema}
          temasDisabled={temasBloqueados}
          onSelectTema={seleccionarTema}
        />

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto scrollbar-chat">
          <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 py-4">
            <div className="mb-5 flex items-center gap-3 text-xs font-semibold text-zinc-500">
              <span className="h-px flex-1 bg-chat-line" />
              Hoy
              <span className="h-px flex-1 bg-chat-line" />
            </div>

            {faqGrupo && (
              <div className="mb-5 rounded-2xl border border-chat-line bg-chat-shell px-4 py-3">
                <button
                  type="button"
                  onClick={() => setFaqOpen((v) => !v)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                      Preguntas frecuentes
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-zinc-100">{faqGrupo.titulo}</p>
                  </div>
                  <ChevronDown
                    className={cn("h-4 w-4 text-zinc-400 transition-transform", faqOpen && "rotate-180")}
                  />
                </button>

                {faqOpen && (
                  <div className="mt-3 space-y-2">
                    {faqGrupo.preguntas.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={async () => {
                          setFaqOpen(false);
                          await enviarPregunta(q);
                        }}
                        className="flex w-full items-center justify-between gap-3 rounded-full border border-zinc-700 bg-[#222220] px-4 py-2 text-left text-xs font-semibold text-zinc-200 shadow-sm transition hover:-translate-y-px hover:border-zinc-500 hover:bg-white/5 hover:shadow-soft active:translate-y-0"
                      >
                        <span className="min-w-0 flex-1">{q}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 space-y-4">
              {mensajes.map((m) => (
                <MensajeBurbuja
                  key={m.id_mensaje}
                  mensaje={m}
                  variant={(m as MensajeUI).variant ?? "normal"}
                />
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

              {subiendoArchivo && (
                <div className="ml-11 text-xs font-semibold text-zinc-500">
                  Preparando documento para la base de conocimiento...
                </div>
              )}
            </div>
          </div>
        </div>

        <CajaPregunta
          onSend={enviarPregunta}
          onAttach={adjuntarArchivo}
          disabled={enviando || subiendoArchivo}
        />
      </main>

      <RightPanel
        conversaciones={conversacionesVisibles}
        archivedChats={conversacionesArchivadas}
        documentos={documentos}
        showDocumentosBase={user?.rol === "administrador"}
        activeId={activa?.id_conversacion ?? null}
        mode={panelMode}
        search={panelSearch}
        temasPorConversacion={temasPorConversacion}
        canNewChat={canNewChat}
        onSelect={seleccionar}
        onNew={nuevoChat}
        onArchive={archivar}
        onRestoreArchived={restaurarArchivado}
        onDelete={eliminar}
        onSearchChange={setPanelSearch}
      />

      <ConfirmDialog
        open={confirmDeleteAll}
        title="¿Eliminar todos los chats?"
        description="Se borraran todas las conversaciones del historial. Esta accion no se puede deshacer."
        confirmLabel="Si, eliminar todos"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={eliminarTodosLosChats}
        onCancel={() => setConfirmDeleteAll(false)}
      />
    </div>
  );
}
