"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const SLIDES = [
  {
    titulo: "Bienvenido a la UNT",
    descripcion:
      "Casa de estudios histórica del norte del Perú, fundada en 1824 por el Libertador Simón Bolívar.",
    gradient: "from-unt-blue-900 via-unt-blue-700 to-unt-blue-500",
  },
  {
    titulo: "Ingeniería de Sistemas",
    descripcion:
      "Forma profesionales capaces de diseñar, implementar y gestionar soluciones tecnológicas con visión integral.",
    gradient: "from-unt-blue-700 via-unt-blue-600 to-unt-gold-600",
  },
  {
    titulo: "Tu asistente 24/7",
    descripcion:
      "Resuelve tus dudas sobre matrícula, sílabos, biblioteca, prácticas, trámites y mucho más con QueryBot.",
    gradient: "from-unt-gold-600 via-unt-gold-500 to-unt-blue-700",
  },
];

export function Carrusel() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 5500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative h-72 sm:h-96 overflow-hidden rounded-2xl shadow-soft">
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0 flex flex-col justify-center p-8 sm:p-14 text-white transition-opacity duration-700",
            "bg-gradient-to-br",
            s.gradient,
            i === idx ? "opacity-100" : "opacity-0",
          )}
        >
          <h2 className="text-3xl sm:text-5xl font-bold drop-shadow-lg max-w-2xl">{s.titulo}</h2>
          <p className="mt-4 max-w-xl text-base sm:text-lg text-white/90">{s.descripcion}</p>
        </div>
      ))}

      <button
        type="button"
        aria-label="Anterior"
        onClick={() => setIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Siguiente"
        onClick={() => setIdx((i) => (i + 1) % SLIDES.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            type="button"
            key={i}
            aria-label={`Ir al slide ${i + 1}`}
            onClick={() => setIdx(i)}
            className={cn(
              "h-2 rounded-full transition-all",
              i === idx ? "w-8 bg-unt-gold-400" : "w-2 bg-white/60",
            )}
          />
        ))}
      </div>
    </div>
  );
}
