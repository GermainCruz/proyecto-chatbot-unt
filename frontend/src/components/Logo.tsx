"use client";

import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-gradient-to-br from-unt-blue-700 to-unt-blue-900 text-unt-gold-400 shadow-soft">
        {!imgError ? (
          <Image
            src="/logoUNT.png"
            alt="Logo"
            fill
            sizes="36px"
            className="object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <MessageCircle className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="leading-tight">
        <p className="text-base font-semibold tracking-tight text-unt-blue-900 dark:text-unt-blue-100">
          QueryBot
        </p>
        <p className="text-[11px] uppercase tracking-wider text-unt-gold-600">
          Asistente academico documental
        </p>
      </div>
    </div>
  );
}
