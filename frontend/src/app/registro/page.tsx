"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";

import { Logo } from "@/components/Logo";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function RegistroPage() {
  const { registro } = useAuth();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!correo.toLowerCase().endsWith("@unitru.edu.pe")) {
      setError("Solo se aceptan correos @unitru.edu.pe");
      return;
    }
    setLoading(true);
    try {
      await registro(nombre.trim(), correo.trim().toLowerCase(), password);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-unt-gold-600 via-unt-gold-500 to-unt-blue-700 p-10 text-white">
        <Logo className="text-white [&_p]:!text-white" />
        <div className="space-y-3 max-w-md">
          <h2 className="text-4xl font-bold leading-tight">
            Únete a la comunidad UNT digital.
          </h2>
          <p className="text-white/85">
            Crea tu cuenta con tu correo institucional para empezar a chatear con UNT Bot.
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
            Crear cuenta
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Solo correos <strong>@unitru.edu.pe</strong>.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="nombre">Nombre completo</label>
              <input
                id="nombre"
                required
                minLength={3}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="input"
                placeholder="Apellidos y nombres"
              />
            </div>
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
            <div className="grid sm:grid-cols-2 gap-3">
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
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    aria-label="Ver contraseña"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label" htmlFor="confirmar">Confirmar</label>
                <input
                  id="confirmar"
                  type={showPwd ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  className="input"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-gold w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Crear cuenta
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-unt-blue-700 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
