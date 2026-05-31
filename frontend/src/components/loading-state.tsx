"use client";

export function LoadingState() {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
        <div className="h-5 w-5 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Menganalisis gambar sampah…</p>
          <p className="text-xs text-blue-600 mt-0.5">Menjalankan deteksi YOLO → menghasilkan laporan audit AI</p>
        </div>
      </div>

      {/* Detection skeleton */}
      <SkeletonCard rows={3} />

      {/* Chart skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-100 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-32 rounded-full bg-slate-100 animate-pulse" />
              <div className="h-2.5 w-44 rounded-full bg-slate-100 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-10 gap-4">
          <div className="h-40 w-40 rounded-full border-[14px] border-slate-100 animate-pulse" />
          <div className="flex gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-2.5 w-16 rounded-full bg-slate-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* AI Insight skeleton */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 overflow-hidden">
        <div className="px-6 py-4 border-b border-blue-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-blue-100 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-24 rounded-full bg-blue-100 animate-pulse" />
              <div className="h-2.5 w-48 rounded-full bg-blue-100 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div className="h-14 rounded-xl bg-white/70 animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 rounded-xl bg-white/50 animate-pulse" />
            <div className="h-20 rounded-xl bg-white/50 animate-pulse" />
          </div>
          <div className="h-14 rounded-xl bg-white/70 animate-pulse" />
        </div>
      </div>

      {/* Report skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-100 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 rounded-full bg-slate-100 animate-pulse" />
              <div className="h-2.5 w-52 rounded-full bg-slate-100 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="rounded-xl bg-slate-50 border border-slate-100 p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-slate-200 animate-pulse" />
                <div className="h-3.5 w-36 rounded-full bg-slate-200 animate-pulse" />
              </div>
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-2.5 rounded-full bg-slate-100 animate-pulse" style={{ width: `${92 - j * 12}%` }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard({ rows }: { rows: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-100 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 rounded-full bg-slate-100 animate-pulse" />
            <div className="h-2.5 w-40 rounded-full bg-slate-100 animate-pulse" />
          </div>
        </div>
      </div>
      <div className="p-6 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-200 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 rounded-full bg-slate-200 animate-pulse" />
              <div className="h-1.5 rounded-full bg-slate-100 animate-pulse" style={{ width: `${70 - i * 15}%` }} />
            </div>
            <div className="h-3 w-12 rounded-full bg-slate-200 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
