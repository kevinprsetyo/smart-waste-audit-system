"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FileText, Recycle, Leaf, AlertTriangle, CheckCircle2,
  Sparkles, TrendingUp, ShieldAlert, Lightbulb,
} from "lucide-react";
import type { WasteStatistics } from "@/types/audit";

interface AuditReportProps {
  report: string;
  statistics: WasteStatistics;
}

// ── Section config (Indonesian) ───────────────────────────────────────────────

const SECTIONS = [
  { key: "1.", label: "Ringkasan Sampah",       icon: FileText,     color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200",   headingColor: "text-blue-800"   },
  { key: "2.", label: "Klasifikasi Sampah",      icon: Sparkles,     color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200", headingColor: "text-violet-800" },
  { key: "3.", label: "Rekomendasi Daur Ulang",  icon: Recycle,      color: "text-emerald-600",bg: "bg-emerald-50",border: "border-emerald-200",headingColor: "text-emerald-800"},
  { key: "4.", label: "Dampak Lingkungan",       icon: Leaf,         color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200",  headingColor: "text-amber-800"  },
  { key: "5.", label: "Tindakan yang Disarankan",icon: CheckCircle2, color: "text-teal-600",   bg: "bg-teal-50",   border: "border-teal-200",   headingColor: "text-teal-800"   },
];

interface ParsedSection {
  label: string;
  content: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  headingColor: string;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseReport(raw: string): ParsedSection[] {
  const parsed: ParsedSection[] = [];

  for (let i = 0; i < SECTIONS.length; i++) {
    const section = SECTIONS[i];
    const nextSection = SECTIONS[i + 1];

    const startIdx = raw.search(new RegExp(`(\\*{0,2})(${escapeRegex(section.key)})`, "i"));
    if (startIdx === -1) continue;

    const endIdx = nextSection
      ? raw.search(new RegExp(`(\\*{0,2})(${escapeRegex(nextSection.key)})`, "i"))
      : raw.length;

    let content = raw.slice(startIdx, endIdx === -1 ? raw.length : endIdx);
    // Strip section heading line
    content = content
      .replace(/^\**\d+\.\s*\**[^\n]*\n?/, "")
      .replace(/^#{1,6}\s*[^\n]*\n?/, "")
      .trim();

    if (content) parsed.push({ ...section, content });
  }

  if (parsed.length === 0) {
    return [{
      label: "Laporan Audit",
      content: raw.trim(),
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      headingColor: "text-blue-800",
    }];
  }

  return parsed;
}

// ── Derive AI Insight Summary from statistics + report ───────────────────────

interface AiInsight {
  mainInsight: string;
  riskLevel: "Rendah" | "Sedang" | "Tinggi";
  riskColor: string;
  riskBg: string;
  recommendation: string;
}

function deriveInsight(statistics: WasteStatistics, _report: string): AiInsight {
  const entries = Object.entries(statistics).sort((a, b) => b[1] - a[1]);
  const dominant = entries[0];
  const total = Object.values(statistics).reduce((s, n) => s + n, 0);

  const hazardousTypes = ["battery", "electronic", "chemical", "b3"];
  const hasHazardous = entries.some(([k]) => hazardousTypes.includes(k.toLowerCase()));
  const recycleTypes = ["plastic", "can", "glass", "paper", "plastik", "kaleng", "kaca", "kertas"];
  const recyclableCount = entries.filter(([k]) => recycleTypes.includes(k.toLowerCase()))
    .reduce((s, [, v]) => s + v, 0);
  const recyclePct = total > 0 ? recyclableCount / total : 0;

  const riskLevel: AiInsight["riskLevel"] = hasHazardous ? "Tinggi" : recyclePct < 0.4 ? "Sedang" : "Rendah";

  const riskMap: Record<AiInsight["riskLevel"], { color: string; bg: string }> = {
    Rendah:  { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    Sedang:  { color: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
    Tinggi:  { color: "text-red-700",     bg: "bg-red-50 border-red-200" },
  };

  const dominantLabel = dominant
    ? `${dominant[0].charAt(0).toUpperCase() + dominant[0].slice(1)} mendominasi sampah yang terdeteksi (${dominant[1]} item).`
    : "Komposisi sampah berhasil dianalisis.";

  const recommendations: Record<AiInsight["riskLevel"], string> = {
    Rendah:  "Lanjutkan pemilahan sampah daur ulang dan kirim ke fasilitas pengolahan terdekat.",
    Sedang:  "Pisahkan sampah berdasarkan jenisnya dan tingkatkan program daur ulang di lokasi ini.",
    Tinggi:  "Segera tangani sampah berbahaya sesuai prosedur B3 dan hubungi pengelola limbah bersertifikat.",
  };

  return {
    mainInsight: dominantLabel,
    riskLevel,
    riskColor: riskMap[riskLevel].color,
    riskBg: riskMap[riskLevel].bg,
    recommendation: recommendations[riskLevel],
  };
}

// ── AI Insight Dashboard (top summary cards) ─────────────────────────────────

function AiInsightDashboard({ statistics, report }: { statistics: WasteStatistics; report: string }) {
  const insight = deriveInsight(statistics, report);

  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden shadow-sm mb-5">
      {/* Header */}
      <div className="px-6 py-4 border-b border-blue-200/70 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600">
          <Lightbulb className="text-white" size={15} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-blue-900">Insight Utama</h3>
          <p className="text-xs text-blue-600 mt-0.5">Ringkasan otomatis dari hasil analisis AI</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-200 animate-pulse" />
          AI Generated
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Main insight text */}
        <div className="flex items-start gap-3 rounded-xl bg-white/70 border border-blue-200/50 px-4 py-3.5">
          <span className="text-lg shrink-0 mt-0.5">♻️</span>
          <p className="text-sm text-blue-900 font-medium leading-relaxed">{insight.mainInsight}</p>
        </div>

        {/* Metric cards row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Risk level */}
          <div className={`rounded-xl border px-4 py-3.5 ${insight.riskBg}`}>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert size={14} className={insight.riskColor} />
              <span className="text-xs font-semibold text-slate-500">Risiko Lingkungan</span>
            </div>
            <p className={`text-xl font-bold ${insight.riskColor}`}>{insight.riskLevel}</p>
          </div>

          {/* Trend */}
          <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3.5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-violet-600" />
              <span className="text-xs font-semibold text-slate-500">Status Analisis</span>
            </div>
            <p className="text-xl font-bold text-violet-700">Selesai</p>
          </div>
        </div>

        {/* Recommendation */}
        <div className="rounded-xl border border-emerald-200 bg-white/70 px-4 py-3.5 flex items-start gap-3">
          <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Rekomendasi Utama</p>
            <p className="text-sm text-slate-700 leading-relaxed">{insight.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Markdown renderer using react-markdown ────────────────────────────────────

function MarkdownContent({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="text-sm text-slate-700 leading-relaxed mb-2 last:mb-0">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="space-y-1.5 mb-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="space-y-1.5 mb-2 list-decimal list-inside">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-current opacity-40 shrink-0" />
            <span>{children}</span>
          </li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-slate-800">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-slate-600">{children}</em>
        ),
        h1: ({ children }) => (
          <h1 className="text-base font-bold text-slate-900 mb-2 mt-3 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-sm font-bold text-slate-900 mb-2 mt-3 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold text-slate-800 mb-1.5 mt-2 first:mt-0">{children}</h3>
        ),
        hr: () => <hr className="my-3 border-slate-200" />,
        table: ({ children }) => (
          <div className="overflow-x-auto mb-2 rounded-lg border border-slate-200">
            <table className="text-xs w-full">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-slate-50 text-slate-600 font-semibold">{children}</thead>
        ),
        tbody: ({ children }) => <tbody className="divide-y divide-slate-100">{children}</tbody>,
        tr: ({ children }) => <tr>{children}</tr>,
        th: ({ children }) => <th className="px-3 py-2 text-left font-semibold">{children}</th>,
        td: ({ children }) => <td className="px-3 py-2 text-slate-700">{children}</td>,
        code: ({ children }) => (
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">{children}</code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-300 pl-4 italic text-slate-600 my-2">{children}</blockquote>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function AuditReport({ report, statistics }: AuditReportProps) {
  const sections = useMemo(() => parseReport(report), [report]);

  return (
    <div>
      {/* AI Insight Dashboard — shown first */}
      <AiInsightDashboard statistics={statistics} report={report} />

      {/* Detailed section cards */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
              <AlertTriangle className="text-blue-600" size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Laporan Audit AI</h2>
              <p className="text-xs text-slate-500 mt-0.5">Dibuat oleh Large Language Model</p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              AI Generated
            </span>
          </div>
        </div>

        {/* Sections */}
        <div className="p-6 space-y-4">
          {sections.map((section, i) => {
            const Icon = section.icon;
            return (
              <div key={i} className={`rounded-xl border p-5 ${section.bg} ${section.border}`}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm">
                    <Icon className={section.color} size={14} />
                  </div>
                  <h3 className={`text-sm font-semibold ${section.headingColor}`}>{section.label}</h3>
                </div>
                <MarkdownContent text={section.content} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
