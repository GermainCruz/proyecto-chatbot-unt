import Link from "next/link";
import {
  BookOpen,
  Compass,
  Eye,
  Heart,
  Lightbulb,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Sparkles,
  Target,
} from "lucide-react";

import { Carrusel } from "@/components/Carrusel";
import { Logo } from "@/components/Logo";

const SABIAS_QUE = [
  "La UNT fue fundada el 10 de mayo de 1824 por el Libertador Simón Bolívar.",
  "Es la primera universidad republicana del Perú.",
  "Tiene su sede principal en la ciudad de Trujillo, La Libertad.",
  "Su escudo combina el azul institucional con el dorado, símbolo de tradición académica.",
];

const TEMAS = [
  { icon: BookOpen, t: "Sílabos y currícula" },
  { icon: Compass, t: "Procesos de matrícula" },
  { icon: Heart, t: "Bienestar universitario" },
  { icon: Sparkles, t: "Trámites académicos" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:bg-slate-950/80 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
          <nav className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost">
              Iniciar sesión
            </Link>
            <Link href="/registro" className="btn-gold">
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 space-y-16">
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-unt-gold-300 bg-unt-gold-50 px-3 py-1 text-xs font-medium text-unt-gold-700">
              <Sparkles className="h-3.5 w-3.5" />
              Asistente oficial UNT — Ingeniería de Sistemas
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-unt-blue-900 dark:text-unt-blue-100">
              Resuelve tus dudas universitarias en segundos
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              UNT Bot consulta documentos oficiales recopilados por el equipo y te entrega respuestas claras
              sobre matrícula, sílabos, bienestar, trámites, biblioteca, prácticas y mucho más.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/registro" className="btn-primary">
                Empezar ahora
              </Link>
              <Link href="/login" className="btn-ghost border border-slate-200 dark:border-slate-700">
                Ya tengo cuenta
              </Link>
            </div>
            <p className="text-xs text-slate-500">
              Solo se permite registro con correos institucionales <strong>@unitru.edu.pe</strong>.
            </p>
          </div>
          <Carrusel />
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          <div className="card p-6">
            <div className="flex items-center gap-2 text-unt-blue-700 dark:text-unt-blue-300">
              <Target className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Misión UNT</h3>
            </div>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Formar profesionales competentes con sólida base científica, humanista y ética, comprometidos con
              el desarrollo sostenible de la región y del país.
            </p>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-2 text-unt-blue-700 dark:text-unt-blue-300">
              <Eye className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Visión UNT</h3>
            </div>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Ser una universidad acreditada, innovadora y referente en el norte del Perú, generando
              conocimiento útil para la sociedad.
            </p>
          </div>
        </section>

        <section className="card p-6 sm:p-8">
          <div className="flex items-center gap-2 text-unt-blue-800 dark:text-unt-blue-200">
            <BookOpen className="h-5 w-5" />
            <h3 className="text-xl font-semibold">Carrera profesional de Ingeniería de Sistemas</h3>
          </div>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Forma ingenieros capaces de diseñar, implementar y gestionar soluciones de software, infraestructura
            y datos. El plan de estudios integra programación, bases de datos, redes, gestión de proyectos,
            inteligencia artificial y prácticas preprofesionales.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TEMAS.map(({ icon: Icon, t }) => (
              <div
                key={t}
                className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700"
              >
                <Icon className="h-5 w-5 text-unt-gold-600" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 text-unt-blue-800 dark:text-unt-blue-200">
            <Lightbulb className="h-5 w-5" />
            <h3 className="text-xl font-semibold">¿Sabías que…?</h3>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {SABIAS_QUE.map((s, i) => (
              <div key={i} className="card p-5">
                <p className="text-sm text-slate-700 dark:text-slate-200">{s}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6 sm:p-8">
          <div className="flex items-center gap-2 text-unt-blue-800 dark:text-unt-blue-200">
            <MessageSquare className="h-5 w-5" />
            <h3 className="text-xl font-semibold">Contactos</h3>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-unt-gold-600 mt-0.5" />
              <div>
                <p className="font-medium">Campus universitario</p>
                <p className="text-slate-500">Av. Juan Pablo II s/n, Trujillo, Perú</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-unt-gold-600 mt-0.5" />
              <div>
                <p className="font-medium">Central telefónica</p>
                <p className="text-slate-500">Consulta el directorio oficial UNT</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-unt-gold-600 mt-0.5" />
              <div>
                <p className="font-medium">Correo institucional</p>
                <p className="text-slate-500">@unitru.edu.pe</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500 dark:bg-slate-950 dark:border-slate-800">
        © {new Date().getFullYear()} UNT Bot · Universidad Nacional de Trujillo
      </footer>
    </div>
  );
}
