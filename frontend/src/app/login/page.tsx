"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";

import { Logo } from "@/components/Logo";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(correo.trim().toLowerCase(), password);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-unt-blue-900 via-unt-blue-700 to-unt-blue-500 p-10 text-white">
        <Logo className="text-white [&_p]:!text-white" />
        <div className="space-y-3 max-w-md">
          <h2 className="text-4xl font-bold leading-tight">
            Tu asistente académico, siempre disponible.
          </h2>
          <p className="text-white/80">
            Inicia sesión con tu correo institucional para acceder al chat oficial UNT Bot.
          </p>
        </div>
        <p className="text-xs text-white/70">© Universidad Nacional de Trujillo</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold text-unt-blue-900 dark:text-unt-blue-100">
            Iniciar sesión
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Usa tu correo <strong>@unitru.edu.pe</strong>.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="correo">Correo institucional</label>
              <input
                id="correo"
                type="email"
                required
                placeholder="usuario@unitru.edu.pe"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="input"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Contraseña</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  aria-label={showPwd ? "Ocultar" : "Mostrar"}
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Ingresar
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            ¿Aún no tienes cuenta?{" "}
            <Link href="/registro" className="font-medium text-unt-blue-700 hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
