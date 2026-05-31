"use client";

import { CheckCircle2, X } from "lucide-react";

interface ToastProps {
  show: boolean;
  message: string;
  onClose: () => void;
}

export function Toast({ show, message, onClose }: ToastProps) {
  return (
    <div
      className={`
        fixed top-5 right-5 z-50 flex items-center gap-3
        rounded-2xl border border-emerald-200 bg-white px-5 py-3.5 shadow-xl
        transition-all duration-300 ease-out
        ${show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"}
      `}
      role="status"
      aria-live="polite"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2 className="text-emerald-600" size={16} />
      </div>
      <p className="text-sm font-medium text-slate-800 max-w-xs">{message}</p>
      <button
        onClick={onClose}
        className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Tutup notifikasi"
      >
        <X size={13} />
      </button>
    </div>
  );
}
