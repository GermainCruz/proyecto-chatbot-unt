import { GraduationCap } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-unt-blue-700 to-unt-blue-900 text-unt-gold-400 shadow-soft">
        <GraduationCap className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-base font-semibold tracking-tight text-unt-blue-900 dark:text-unt-blue-100">
          UNT Bot
        </p>
        <p className="text-[11px] uppercase tracking-wider text-unt-gold-600">
          Universidad Nacional de Trujillo
        </p>
      </div>
    </div>
  );
}
