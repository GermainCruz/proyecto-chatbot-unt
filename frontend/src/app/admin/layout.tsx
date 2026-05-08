"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowLeft,
  FileStack,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";

import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/documentos", label: "Documentos", icon: FileStack },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.rol !== "administrador") router.replace("/chat");
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="grid h-screen place-items-center text-slate-500">Cargando…</div>;
  }
  if (user.rol !== "administrador") return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden md:flex h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="p-4">
          <Logo />
        </div>
        <nav className="px-2 flex-1 space-y-0.5">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                  active
                    ? "bg-unt-blue-700 text-white"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800/60",
                )}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-3 dark:border-slate-800 space-y-1">
          <Link href="/chat" className="btn-ghost text-xs w-full justify-start">
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al chat
          </Link>
          <button onClick={logout} className="btn-ghost text-xs w-full justify-start hover:text-red-500">
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto scrollbar-thin bg-slate-50 dark:bg-slate-950">
        {children}
      </main>
    </div>
  );
}
