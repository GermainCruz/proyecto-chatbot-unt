"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldOff, UserCheck, UserX } from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn, formatDate } from "@/lib/utils";

type UsuarioAdmin = {
  id_usuario: number;
  nombre_completo: string;
  correo: string;
  rol: "estudiante" | "administrador";
  activo: boolean;
  fecha_registro: string;
  ultimo_acceso: string | null;
};

export default function AdminUsuariosPage() {
  const { user: yo } = useAuth();
  const [users, setUsers] = useState<UsuarioAdmin[]>([]);

  const cargar = async () => {
    const lista = await api.get<UsuarioAdmin[]>("/admin/usuarios");
    setUsers(lista);
  };

  useEffect(() => {
    cargar();
  }, []);

  const cambiarRol = async (u: UsuarioAdmin) => {
    const nuevo = u.rol === "administrador" ? "estudiante" : "administrador";
    if (!confirm(`¿Cambiar rol de ${u.nombre_completo} a ${nuevo}?`)) return;
    await api.patch(`/admin/usuarios/${u.id_usuario}`, { rol: nuevo });
    cargar();
  };

  const toggleActivo = async (u: UsuarioAdmin) => {
    await api.patch(`/admin/usuarios/${u.id_usuario}`, { activo: !u.activo });
    cargar();
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-unt-blue-900 dark:text-unt-blue-100">
          Usuarios registrados
        </h1>
        <p className="text-sm text-slate-500">
          Gestiona roles y estado de las cuentas <strong>@unitru.edu.pe</strong>.
        </p>
      </header>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Registrado</th>
                <th className="px-4 py-3">Último acceso</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id_usuario}
                  className="border-t border-slate-100 dark:border-slate-800"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.nombre_completo}</p>
                    <p className="text-xs text-slate-500">{u.correo}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        u.rol === "administrador"
                          ? "bg-unt-gold-100 text-unt-gold-700"
                          : "bg-unt-blue-100 text-unt-blue-700",
                      )}
                    >
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        u.activo
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700",
                      )}
                    >
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(u.fecha_registro)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {u.ultimo_acceso ? formatDate(u.ultimo_acceso) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => cambiarRol(u)}
                        disabled={u.id_usuario === yo?.id_usuario}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-unt-blue-700 dark:hover:bg-slate-800 disabled:opacity-50"
                        title="Cambiar rol"
                      >
                        {u.rol === "administrador" ? (
                          <ShieldOff className="h-4 w-4" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => toggleActivo(u)}
                        disabled={u.id_usuario === yo?.id_usuario}
                        className={cn(
                          "rounded p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50",
                          u.activo ? "text-slate-500 hover:text-red-500" : "text-emerald-600",
                        )}
                        title={u.activo ? "Desactivar" : "Activar"}
                      >
                        {u.activo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
