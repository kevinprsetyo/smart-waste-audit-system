// ─────────────────────────────────────────────────────────────────────────────
// types/audit.ts
// TypeScript types for the Smart Waste Audit System API.
// ─────────────────────────────────────────────────────────────────────────────

/** A single object detected by the YOLOv8 model. */
export interface Detection {
  class: string;
  confidence: number;
}

/**
 * Aggregated count of each waste class.
 * e.g. { plastic: 4, can: 2, paper: 1 }
 */
export type WasteStatistics = Record<string, number>;

/** Full response from POST /audit */
export interface AuditResponse {
  success: boolean;
  detections: Detection[];
  statistics: WasteStatistics;
  audit_report: string;
}

/** API error payload returned on failure. */
export interface ApiError {
  detail: string;
}

/** Union type for the audit result state in the UI. */
export type AuditResult =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: AuditResponse }
  | { status: "error"; message: string };

/** A single slice for the pie chart. */
export interface ChartSlice {
  name: string;
  value: number;
  percentage: number;
  fill: string;
}
