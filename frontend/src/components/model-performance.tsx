"use client";

import { Cpu } from "lucide-react";

// Actual YOLO model metrics from training results
const METRICS = [
  { label: "Precision",  value: 80.9, unit: "%", color: "text-blue-600",   bar: "bg-blue-500",   track: "bg-blue-100"   },
  { label: "Recall",     value: 75.5, unit: "%", color: "text-violet-600", bar: "bg-violet-500", track: "bg-violet-100" },
  { label: "mAP50",      value: 82.3, unit: "%", color: "text-emerald-600",bar: "bg-emerald-500",track: "bg-emerald-100" },
];

export function ModelPerformance() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
            <Cpu className="text-slate-600" size={17} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Kinerja Model AI</h2>
            <p className="text-xs text-slate-500 mt-0.5">Metrik YOLOv8 pada dataset pengujian</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-5 py-4 space-y-4">
        {METRICS.map((m) => (
          <div key={m.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-600">{m.label}</span>
              <span className={`text-sm font-bold tabular-nums ${m.color}`}>
                {m.value}{m.unit}
              </span>
            </div>
            <div className={`h-2 w-full rounded-full ${m.track}`}>
              <div
                className={`h-2 rounded-full transition-all duration-700 ${m.bar}`}
                style={{ width: `${m.value}%` }}
              />
            </div>
          </div>
        ))}

        {/* Footer note */}
        <p className="text-[10px] text-slate-400 pt-1 leading-relaxed border-t border-slate-100">
          Performa model YOLOv8 pada dataset pengujian. Nilai lebih tinggi menunjukkan akurasi deteksi yang lebih baik.
        </p>
      </div>
    </div>
  );
}
