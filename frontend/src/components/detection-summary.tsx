"use client";

import type { Detection, WasteStatistics } from "@/types/audit";
import { Package, Trash2, Leaf, CircleDot, Box } from "lucide-react";

interface DetectionSummaryProps {
  detections: Detection[];
  statistics: WasteStatistics;
}

// ── Waste category metadata ───────────────────────────────────────────────────

type WasteCategory = "recyclable" | "organic" | "hazardous" | "general";

interface CategoryMeta {
  label: string;
  emoji: string;
  pill: string;
}

const CATEGORY_META: Record<WasteCategory, CategoryMeta> = {
  recyclable: { label: "Dapat Didaur Ulang", emoji: "♻️", pill: "bg-blue-100 text-blue-700 border-blue-200" },
  organic:    { label: "Organik",            emoji: "🌱", pill: "bg-green-100 text-green-700 border-green-200" },
  hazardous:  { label: "Berbahaya",          emoji: "⚠️", pill: "bg-red-100 text-red-700 border-red-200" },
  general:    { label: "Umum",               emoji: "🗑️", pill: "bg-slate-100 text-slate-600 border-slate-200" },
};

const WASTE_CATEGORY: Record<string, WasteCategory> = {
  plastic:     "recyclable",
  can:         "recyclable",
  glass:       "recyclable",
  paper:       "recyclable",
  "egg shell": "organic",
  food:        "organic",
  battery:     "hazardous",
  electronic:  "hazardous",
};

function getCategory(className: string): WasteCategory {
  return WASTE_CATEGORY[className.toLowerCase()] ?? "general";
}

// ── Waste-class display config ────────────────────────────────────────────────

const CLASS_CONFIG: Record<string, {
  color: string; bg: string; border: string; icon: React.ElementType; labelId: string
}> = {
  plastic:     { color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",   icon: Package,   labelId: "Plastik"     },
  can:         { color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200",  icon: CircleDot, labelId: "Kaleng"      },
  paper:       { color: "text-emerald-700",bg: "bg-emerald-50",border: "border-emerald-200",icon: Leaf,      labelId: "Kertas"      },
  glass:       { color: "text-cyan-700",   bg: "bg-cyan-50",   border: "border-cyan-200",   icon: Box,       labelId: "Kaca"        },
  "egg shell": { color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", icon: CircleDot, labelId: "Cangkang"    },
};

const DEFAULT_CONFIG = {
  color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200",
  icon: Trash2, labelId: "",
};

function getConfig(className: string) {
  return CLASS_CONFIG[className.toLowerCase()] ?? { ...DEFAULT_CONFIG, labelId: className };
}

// ── Confidence badge ──────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 85 ? "bg-emerald-500" : pct >= 65 ? "bg-amber-500" : "bg-red-400";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {pct}%
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DetectionSummary({ detections, statistics }: DetectionSummaryProps) {
  const totalObjects = Object.values(statistics).reduce((s, n) => s + n, 0);
  const wasteClasses = Object.entries(statistics).sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
              <Trash2 className="text-emerald-600" size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Sampah Terdeteksi</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {totalObjects} objek terdeteksi dalam {wasteClasses.length} kategori
              </p>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {totalObjects} total
          </span>
        </div>
      </div>

      {/* Waste class rows */}
      <div className="px-6 py-5 space-y-3">
        {wasteClasses.map(([className, count]) => {
          const { color, bg, border, icon: Icon, labelId } = getConfig(className);
          const pct = Math.round((count / totalObjects) * 100);
          const cat = getCategory(className);
          const catMeta = CATEGORY_META[cat];

          return (
            <div key={className} className={`rounded-xl border px-4 py-3.5 ${bg} ${border}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm border ${border} shrink-0`}>
                  <Icon className={color} size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold capitalize ${color}`}>
                        {labelId || className}
                      </span>
                      {/* Category pill */}
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${catMeta.pill}`}>
                        <span>{catMeta.emoji}</span>
                        <span>{catMeta.label}</span>
                      </span>
                    </div>
                    <span className={`text-xs font-bold shrink-0 ${color}`}>
                      {count} item
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-white/70">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-700 ${color.replace("text-", "bg-").replace("-700", "-500")}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-400 shrink-0">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Individual detections list */}
      {detections.length > 0 && (
        <div className="px-6 pb-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
            Detail Deteksi
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
            {detections.map((d, i) => {
              const { color, bg, border } = getConfig(d.class);
              const { labelId } = getConfig(d.class);
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 ${bg} ${border}`}
                >
                  <span className={`text-xs font-medium capitalize ${color}`}>{labelId || d.class}</span>
                  <ConfidenceBadge confidence={d.confidence} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
