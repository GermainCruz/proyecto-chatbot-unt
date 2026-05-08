"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { ApiError, api, tokenStorage, type Usuario } from "@/lib/api";

type AuthContextValue = {
  user: Usuario | null;
  loading: boolean;
  login: (correo: string, password: string) => Promise<void>;
  registro: (nombre: string, correo: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      if (!tokenStorage.getAccess()) {
        setUser(null);
        return;
      }
      const me = await api.get<Usuario>("/auth/me");
      setUser(me);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        tokenStorage.clear();
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (correo: string, password: string) => {
    const tokens = await api.post<{ access_token: string; refresh_token: string }>(
      "/auth/login",
      { correo, password },
    );
    tokenStorage.set(tokens.access_token, tokens.refresh_token);
    await fetchUser();
    router.push("/chat");
  };

  const registro = async (nombre_completo: string, correo: string, password: string) => {
    const tokens = await api.post<{ access_token: string; refresh_token: string }>(
      "/auth/registro",
      { nombre_completo, correo, password },
    );
    tokenStorage.set(tokens.access_token, tokens.refresh_token);
    await fetchUser();
    router.push("/chat");
  };

  const logout = async () => {
    try {
      const refresh = tokenStorage.getRefresh();
      if (refresh) await api.post("/auth/logout", { refresh_token: refresh });
    } catch {
      /* ignorar */
    }
    tokenStorage.clear();
    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, registro, logout, refresh: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
