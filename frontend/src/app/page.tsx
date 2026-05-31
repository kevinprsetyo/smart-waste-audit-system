"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Recycle, Zap, Server, Brain } from "lucide-react";

import { UploadCard } from "@/components/upload-card";
import { DetectionSummary } from "@/components/detection-summary";
import { StatisticsChart } from "@/components/statistics-chart";
import { AuditReport } from "@/components/audit-report";
import { RecyclabilityScore } from "@/components/recyclability-score";

import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import { Toast } from "@/components/toast";

import { uploadWasteImage } from "@/lib/api";
import type { AuditResult } from "@/types/audit";

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ result }: { result: AuditResult }) {
  if (result.status === "idle") return null;

  const map = {
    loading: { label: "Menganalisis…",       dot: "animate-pulse bg-blue-500",  text: "text-blue-700",   bg: "bg-blue-50 border-blue-200"   },
    success: { label: "Analisis selesai",     dot: "bg-emerald-500",             text: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200" },
    error:   { label: "Analisis gagal",       dot: "bg-red-500",                 text: "text-red-700",    bg: "bg-red-50 border-red-200"     },
  } as const;

  const cfg = map[result.status as keyof typeof map];
  if (!cfg) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Tech badge ────────────────────────────────────────────────────────────────

// function TechBadge({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
//   return (
//     <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
//       <Icon className="text-blue-500 shrink-0" size={11} />
//       <span className="text-xs font-semibold text-slate-700">{label}</span>
//     </div>
//   );
// }

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [result, setResult] = useState<AuditResult>({ status: "idle" });
  const [showToast, setShowToast] = useState(false);

  const handleAnalyze = useCallback(async (file: File) => {
    setResult({ status: "loading" });
    setShowToast(false);
    try {
      const data = await uploadWasteImage(file);
      setResult({ status: "success", data });
      setShowToast(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan yang tidak terduga.";
      setResult({ status: "error", message });
    }
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(false), 4000);
    return () => clearTimeout(t);
  }, [showToast]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Toast ── */}
      <Toast
        show={showToast}
        message="Analisis berhasil diselesaikan! Laporan siap."
        onClose={() => setShowToast(false)}
      />

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-sm shadow-blue-300">
                <Recycle className="text-white" size={15} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-slate-900 tracking-tight">Smart Waste Audit</span>
                <span className="hidden sm:block text-[10px] font-medium text-slate-400 mt-0.5">
                  Sistem Analisis Sampah Berbasis AI
                </span>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <StatusBadge result={result} />
             
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              {/* Live badge */}
              {/* <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 mb-5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-semibold text-blue-700">Sistem Aktif · Pipeline AI Fase 2</span>
              </div> */}

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                Smart Waste Audit System
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-500 leading-relaxed max-w-xl">
                Sistem Analisis Sampah Berbasis AI Menggunakan YOLOv8 dan Large Language Model.
              </p>

              {/* Tech pill badges */}
              {/* <div className="flex flex-wrap gap-2 mt-5">
                {[
                  { label: "YOLOv8", color: "bg-blue-100 text-blue-700 border-blue-200" },
                  { label: "Ollama LLM", color: "bg-violet-100 text-violet-700 border-violet-200" },
                  { label: "FastAPI", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
                  { label: "Next.js", color: "bg-slate-100 text-slate-700 border-slate-200" },
                ].map((b) => (
                  <span key={b.label} className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${b.color}`}>
                    {b.label}
                  </span>
                ))}
              </div> */}
            </div>

            {/* Pipeline steps */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
             
            </div>
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">

          {/* ── Left: Upload panel ── */}
          <div className="lg:sticky lg:top-[88px] space-y-4">
            <UploadCard onAnalyze={handleAnalyze} isLoading={result.status === "loading"} />

            {/* How it works */}
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Cara Kerja
              </p>
              <ol className="space-y-3">
                {[
                  { n: 1, label: "Unggah foto sampah (JPEG/PNG/WEBP)" },
                  { n: 2, label: "YOLOv8 mendeteksi objek dan tingkat kepercayaan" },
                  { n: 3, label: "Statistik dikelompokkan berdasarkan jenis sampah" },
                  { n: 4, label: "LLM menghasilkan laporan audit lingkungan" },
                ].map((step) => (
                  <li key={step.n} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white mt-0.5">
                      {step.n}
                    </span>
                    <span className="text-xs text-slate-600 leading-relaxed">{step.label}</span>
                  </li>
                ))}
              </ol>
            </div>


          </div>

          {/* ── Right: Results ── */}
          <div className="space-y-5">
            {result.status === "idle" && <EmptyState />}
            {result.status === "loading" && <LoadingState />}

            {result.status === "error" && (
              <div className="rounded-2xl border border-red-200 bg-red-50 overflow-hidden shadow-sm">
                <div className="flex items-start gap-4 px-6 py-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
                    <AlertCircle className="text-red-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-red-800">Analisis Gagal</h3>
                    <p className="mt-1.5 text-sm text-red-700 leading-relaxed">{result.message}</p>
                  </div>
                </div>
                <div className="border-t border-red-200 bg-red-50/50 px-6 py-3">
                  <p className="text-xs text-red-600">
                    Pastikan backend FastAPI berjalan di{" "}
                    <code className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-xs">http://localhost:8000</code>{" "}
                    dan <code className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-xs">OLLAMA_API_KEY</code> sudah diatur.
                  </p>
                </div>
              </div>
            )}

            {result.status === "success" && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* No detections fallback */}
                {result.data.detections.length === 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 shadow-sm">
                    <p className="text-sm font-semibold text-amber-800">Tidak Ada Sampah Terdeteksi</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Model tidak mendeteksi sampah pada gambar ini. Coba foto yang lebih jelas dengan sampah yang terlihat.
                    </p>
                  </div>
                )}

                {/* Detection summary */}
                {result.data.detections.length > 0 && (
                  <DetectionSummary
                    detections={result.data.detections}
                    statistics={result.data.statistics}
                  />
                )}

                {/* Statistics + Score row */}
                {Object.keys(result.data.statistics).length > 0 && (
                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">
                    <StatisticsChart statistics={result.data.statistics} />
                    <RecyclabilityScore statistics={result.data.statistics} />
                  </div>
                )}

                {/* AI Audit Report */}
                <AuditReport
                  report={result.data.audit_report}
                  statistics={result.data.statistics}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600">
              <Recycle className="text-white" size={12} />
            </div>
            <span className="text-xs text-slate-500">
              Smart Waste Audit System · Analisis Lingkungan Berbasis AI
            </span>
          </div>
          {/* <span className="text-xs text-slate-400">YOLOv8 · Ollama Cloud · FastAPI · Next.js</span> */}
        </div>
      </footer>
    </div>
  );
}
