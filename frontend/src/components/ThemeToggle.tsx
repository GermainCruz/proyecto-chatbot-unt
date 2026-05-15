"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  showLabel?: boolean;
  variant?: "default" | "ghost" | "chat";
};

export function ThemeToggle({ className, showLabel = false, variant = "default" }: Props) {
  const { theme, toggleTheme, ready } = useTheme();

  if (!ready) {
    return (
      <div
        className={cn("h-9 w-9 animate-pulse rounded-lg bg-qb-muted/30", className)}
        aria-hidden
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition",
        variant === "default" &&
          "border border-qb-line bg-qb-surface px-3 py-2 text-qb-text hover:bg-qb-elevated",
        variant === "ghost" &&
          "px-2 py-2 text-qb-muted hover:bg-qb-elevated hover:text-qb-text",
        variant === "chat" &&
          "h-9 w-9 border border-qb-line bg-qb-elevated text-qb-muted hover:border-qb-accent/40 hover:text-qb-accent",
        className,
      )}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {showLabel && <span>{isDark ? "Claro" : "Oscuro"}</span>}
    </button>
  );
}
