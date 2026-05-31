"use client";

import { useMemo } from "react";
import type { WasteStatistics } from "@/types/audit";
import { Award } from "lucide-react";

interface RecyclabilityScoreProps {
  statistics: WasteStatistics;
}

const RECYCLABLE = ["plastic", "can", "glass", "paper", "plastik", "kaleng", "kaca", "kertas", "metal", "cardboard"];
const ORGANIC     = ["egg shell", "food", "organic", "leaves", "cangkang"];
const HAZARDOUS   = ["battery", "electronic", "chemical", "b3", "baterai"];

function computeScore(statistics: WasteStatistics): number {
  const entries = Object.entries(statistics);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return 0;

  let score = 0;
  for (const [className, count] of entries) {
    const key = className.toLowerCase();
    const weight =
      RECYCLABLE.includes(key) ? 100 :
      ORGANIC.includes(key)    ? 60  :
      HAZARDOUS.includes(key)  ? 5   :
                                 40;
    score += weight * count;
  }
  return Math.min(100, Math.round(score / total));
}

export function RecyclabilityScore({ statistics }: RecyclabilityScoreProps) {
  const score = useMemo(() => computeScore(statistics), [statistics]);

  const tier =
    score >= 80 ? { label: "Sangat Baik", color: "text-emerald-700", ring: "bg-emerald-500", bar: "bg-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" } :
    score >= 50 ? { label: "Cukup",       color: "text-amber-700",   ring: "bg-amber-500",   bar: "bg-amber-500",   bg: "bg-amber-50",   border: "border-amber-200"   } :
                  { label: "Perlu Perbaikan", color: "text-red-700", ring: "bg-red-500",    bar: "bg-red-500",     bg: "bg-red-50",     border: "border-red-200"     };

  const circumference = 2 * Math.PI * 36; // r=36
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className={`rounded-2xl border ${tier.border} ${tier.bg} shadow-sm overflow-hidden`}>
      {/* Header */}
      <div className={`px-5 py-4 border-b ${tier.border}`}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 shadow-sm">
            <Award className={tier.color} size={18} />
          </div>
          <div>
            <h2 className={`text-sm font-semibold ${tier.color}`}>Skor Daur Ulang</h2>
            <p className="text-xs text-slate-500 mt-0.5">Indeks daur ulang sampah</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 flex flex-col items-center gap-4">
        {/* SVG ring gauge */}
        <div className="relative">
          <svg width="100" height="100" className="-rotate-90">
            {/* Track */}
            <circle cx="50" cy="50" r="36" fill="none" stroke="#e2e8f0" strokeWidth="10" />
            {/* Fill */}
            <circle
              cx="50" cy="50" r="36"
              fill="none"
              stroke={score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444"}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold leading-none ${tier.color}`}>{score}</span>
            <span className="text-[10px] text-slate-400 font-medium">/100</span>
          </div>
        </div>

        {/* Label */}
        <div className="text-center">
          <p className={`text-sm font-semibold ${tier.color}`}>{tier.label}</p>
          <p className="text-xs text-slate-400 mt-0.5">Potensi daur ulang</p>
        </div>

        {/* Progress bar */}
        <div className="w-full">
          <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
            <span>0</span>
            <span>100</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/70 border border-slate-200">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${tier.bar}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Scale legend */}
        <div className="w-full grid grid-cols-3 gap-1 text-center text-[10px] font-medium">
          <span className="rounded-full bg-red-100 text-red-700 px-2 py-1">{"<50 Rendah"}</span>
          <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-1">50-79 Cukup</span>
          <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-1">80+ Baik</span>
        </div>
      </div>
    </div>
  );
}
