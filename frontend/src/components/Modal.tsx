"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  type?: "info" | "danger" | "warning" | "success";
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  type = "info",
}: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const typeStyles = {
    info: "text-unt-blue-900 dark:text-unt-blue-100",
    danger: "text-red-900 dark:text-red-100",
    warning: "text-unt-gold-900 dark:text-unt-gold-100",
    success: "text-emerald-900 dark:text-emerald-100",
  };

  const borderStyles = {
    info: "border-unt-blue-200 dark:border-unt-blue-800",
    danger: "border-red-200 dark:border-red-800",
    warning: "border-unt-gold-200 dark:border-unt-gold-800",
    success: "border-emerald-200 dark:border-emerald-800",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className={cn(
        "relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-950 border",
        borderStyles[type]
      )}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h3 className={cn("text-lg font-semibold", typeStyles[type])}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
          {children}
        </div>

        {footer && (
          <div className="flex justify-end gap-3 bg-slate-50 px-6 py-4 dark:bg-slate-900/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
