"use client";

import { Leaf } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center">
      {/* Illustration */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-blue-100 opacity-40 scale-150 blur-xl" />
        <div className="absolute inset-0 rounded-full bg-emerald-100 opacity-30 scale-125 blur-lg" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white border border-slate-200 shadow-lg">
          <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-blue-500 shadow-md shadow-blue-200 flex items-center justify-center">
            <span className="h-2 w-2 rounded-full bg-white" />
          </span>
          <span className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-emerald-400 shadow-md shadow-emerald-200" />
          <span className="absolute top-2 -left-3 h-3 w-3 rounded-full bg-amber-300 shadow-md shadow-amber-200" />
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-inner">
            <Leaf className="text-white" size={26} />
          </div>
        </div>
      </div>

      <h3 className="text-base font-semibold text-slate-800 mb-2">Belum Ada Gambar</h3>
      <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
        Unggah gambar sampah untuk memulai analisis.{" "}
        <span className="font-medium text-blue-600">Analisis Sampah</span>{" "}
        akan mendeteksi dan menghasilkan laporan audit lingkungan secara otomatis.
      </p>

      {/* Feature pills */}
      {/* <div className="flex flex-wrap justify-center gap-2 mt-6">
        {[
          { label: "Deteksi YOLOv8",  color: "bg-blue-50 text-blue-700 border-blue-200"   },
          { label: "Statistik Sampah",color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
          { label: "Laporan AI",      color: "bg-violet-50 text-violet-700 border-violet-200" },
        ].map((b) => (
          <span key={b.label} className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${b.color}`}>
            {b.label}
          </span>
        ))}
      </div> */}
    </div>
  );
}
