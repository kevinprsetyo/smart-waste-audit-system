"use client";

import type { WasteStatistics, ChartSlice } from "@/types/audit";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { BarChart2 } from "lucide-react";

interface StatisticsChartProps {
  statistics: WasteStatistics;
}

const PALETTE = [
  "#2563eb", "#16a34a", "#f59e0b", "#0891b2",
  "#7c3aed", "#db2777", "#ea580c", "#475569",
];

// ── Custom tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartSlice }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-xs font-semibold text-slate-900 capitalize">{item.name}</p>
      <p className="text-xs text-slate-500 mt-0.5">
        {item.value} item · {item.percentage}%
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function StatisticsChart({ statistics }: StatisticsChartProps) {
  const total = Object.values(statistics).reduce((s, n) => s + n, 0);
  const dominant = Object.entries(statistics).sort((a, b) => b[1] - a[1])[0];

  const slices: ChartSlice[] = Object.entries(statistics)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name,
      value,
      percentage: Math.round((value / total) * 100),
      fill: PALETTE[i % PALETTE.length],
    }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
            <BarChart2 className="text-violet-600" size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Distribusi Sampah</h2>
            <p className="text-xs text-slate-500 mt-0.5">Komposisi berdasarkan jenis</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Donut chart with center label */}
        <div className="relative h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={3}
                dataKey="value"
                animationBegin={0}
                animationDuration={700}
                strokeWidth={0}
              >
                {slices.map((slice, i) => (
                  <Cell key={`cell-${i}`} fill={slice.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs font-medium text-slate-400 mb-0.5">Total Sampah</span>
            <span className="text-3xl font-bold text-slate-900 leading-none">{total}</span>
            <span className="text-xs text-slate-400 mt-1 font-medium">item</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-3 mt-3">
          {slices.map((slice) => (
            <div key={slice.name} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.fill }} />
              <span className="text-xs text-slate-600 capitalize">
                {slice.name} <span className="font-semibold text-slate-800">{slice.percentage}%</span>
              </span>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="mt-5 grid grid-cols-3 divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50">
          <div className="px-3 py-3 text-center">
            <p className="text-lg font-bold text-slate-900">{slices.length}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Jumlah Kelas</p>
          </div>
          <div className="px-3 py-3 text-center">
            <p className="text-lg font-bold text-slate-900">{total}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Total Objek</p>
          </div>
          <div className="px-3 py-3 text-center">
            <p className="text-lg font-bold text-slate-900 capitalize truncate">{dominant?.[0] ?? "—"}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Kelas Dominan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
