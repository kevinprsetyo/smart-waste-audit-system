// ─────────────────────────────────────────────────────────────────────────────
// lib/api.ts
// API client for the Smart Waste Audit System FastAPI backend.
// ─────────────────────────────────────────────────────────────────────────────

import type { AuditResponse } from "@/types/audit";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Upload a waste image to the FastAPI backend and receive a full audit report.
 *
 * @param file - The image file selected or dropped by the user.
 * @returns     Parsed AuditResponse from the backend.
 * @throws      Error with a human-readable message on any failure.
 */
export async function uploadWasteImage(file: File): Promise<AuditResponse> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/audit`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error(
      "Cannot connect to the analysis server. Make sure the backend is running on http://localhost:8000."
    );
  }

  if (!response.ok) {
    // Try to extract a meaningful error message from the FastAPI error body
    let detail = `Server error (HTTP ${response.status})`;
    try {
      const errorBody = await response.json();
      if (typeof errorBody?.detail === "string") {
        detail = errorBody.detail;
      }
    } catch {
      // ignore JSON parse failure — use the default message
    }

    if (response.status === 503) {
      throw new Error(
        `AI report service is unavailable: ${detail}. Check that OLLAMA_API_KEY is configured correctly.`
      );
    }
    if (response.status === 415) {
      throw new Error("Unsupported file type. Please upload a JPEG, PNG, WEBP, or BMP image.");
    }
    if (response.status === 413) {
      throw new Error("File is too large. Maximum allowed size is 20 MB.");
    }

    throw new Error(detail);
  }

  const data = await response.json();
  return data as AuditResponse;
}
