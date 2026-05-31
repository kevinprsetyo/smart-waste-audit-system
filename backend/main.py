"""
main.py
-------
FastAPI entry point for the Smart Waste Audit System — AI inference service.

Endpoints
---------
POST /detect   – Upload an image → YOLOv8 detection results (Phase 1).
POST /audit    – Upload an image → YOLO + statistics + Ollama audit report (Phase 2).
GET  /health   – Liveness probe: confirms the server and model are ready.

Usage
-----
    uvicorn main:app --reload

Interactive docs available at:
    http://127.0.0.1:8000/docs
"""

import logging
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from services.detector import load_model, run_inference
from services.ollama_service import OllamaServiceError, generate_audit_report
from services.statistics import WasteStatistics, build_audit_prompt, compute_statistics

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s – %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Upload directory
# ---------------------------------------------------------------------------
UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# File validation constants
# ---------------------------------------------------------------------------
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/tiff",
}

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".tif"}

MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB


# ---------------------------------------------------------------------------
# Pydantic response models
# ---------------------------------------------------------------------------

class DetectionItem(BaseModel):
    """A single detected waste object."""

    class_name: str = Field(..., alias="class", description="Detected waste class label")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score [0–1]")

    model_config = {"populate_by_name": True}


class DetectResponse(BaseModel):
    """Response schema for POST /detect."""

    success: bool = Field(True, description="Whether the request succeeded")
    detections: List[DetectionItem] = Field(
        default_factory=list,
        description="List of detected waste objects sorted by confidence (desc)",
    )


class AuditResponse(BaseModel):
    """Response schema for POST /audit."""

    success: bool = Field(True, description="Whether the request succeeded")
    detections: List[DetectionItem] = Field(
        default_factory=list,
        description="Raw YOLO detections sorted by confidence (desc)",
    )
    statistics: WasteStatistics = Field(
        default_factory=dict,
        description="Aggregated waste counts per class",
    )
    audit_report: str = Field(
        ...,
        description="AI-generated environmental audit report from Ollama Cloud",
    )


class HealthResponse(BaseModel):
    """Response schema for GET /health."""

    status: str
    message: str


# ---------------------------------------------------------------------------
# Lifespan: load YOLO model once at startup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the YOLOv8 model before accepting requests; log on shutdown."""
    logger.info("=== Smart Waste Audit System – AI Service starting ===")
    try:
        load_model()
    except FileNotFoundError as exc:
        logger.critical("STARTUP FAILED – model not found: %s", exc)
        raise
    yield
    logger.info("=== AI Service shutting down ===")


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Smart Waste Audit System – AI Inference API",
    description=(
        "Upload an image to detect waste objects using a custom-trained YOLOv8 model.\n\n"
        "**Phase 1** `/detect` — Returns raw detection results.\n\n"
        "**Phase 2** `/audit` — Returns detections + waste statistics + "
        "an AI-generated environmental audit report via Ollama Cloud."
    ),
    version="2.0.0",
    contact={"name": "Smart Waste Audit System"},
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _validate_image(file: UploadFile) -> None:
    """
    Validate that the uploaded file is an accepted image type.

    Raises
    ------
    HTTPException 415
        If the MIME type or file extension is not in the allowed sets.
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported media type '{file.content_type}'. "
                f"Accepted: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}"
            ),
        )

    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported file extension '{ext}'. "
                f"Accepted: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            ),
        )


async def _read_and_validate_size(file: UploadFile) -> bytes:
    """
    Read the uploaded file bytes and enforce size limits.

    Returns
    -------
    bytes
        Raw file contents.

    Raises
    ------
    HTTPException 400
        If the file is empty.
    HTTPException 413
        If the file exceeds MAX_FILE_SIZE_BYTES.
    """
    contents: bytes = await file.read()

    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                f"File size ({len(contents) // 1024} KB) exceeds the "
                f"maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB."
            ),
        )

    return contents


def _save_temp_file(contents: bytes, original_filename: str) -> Path:
    """
    Write *contents* to a uniquely-named temp file inside UPLOAD_DIR.

    Returns
    -------
    Path
        Absolute path to the written file.
    """
    ext = Path(original_filename).suffix.lower() or ".jpg"
    temp_path = UPLOAD_DIR / f"{uuid.uuid4().hex}{ext}"
    temp_path.write_bytes(contents)
    logger.info("Saved temp upload → %s (%d bytes)", temp_path.name, len(contents))
    return temp_path


def _cleanup(temp_path: Path) -> None:
    """Silently remove *temp_path* if it still exists."""
    if temp_path.exists():
        try:
            temp_path.unlink()
            logger.debug("Deleted temp file: %s", temp_path.name)
        except OSError as exc:
            logger.warning("Could not delete temp file '%s': %s", temp_path.name, exc)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get(
    "/health",
    summary="Health check",
    tags=["Utility"],
    response_model=HealthResponse,
    response_description="Service liveness status",
)
async def health_check() -> HealthResponse:
    """
    Simple liveness probe.

    Returns `200 OK` when the server is running and the YOLO model is loaded.
    """
    return HealthResponse(status="ok", message="AI inference service is running.")


@app.post(
    "/detect",
    summary="Detect waste objects in an image",
    tags=["Phase 1 – Detection"],
    response_model=DetectResponse,
    response_description="List of detected waste objects with confidence scores",
    status_code=status.HTTP_200_OK,
)
async def detect(
    file: UploadFile = File(
        ...,
        description="Image to analyse — JPEG, PNG, WEBP, BMP, or TIFF (max 20 MB)",
    ),
) -> JSONResponse:
    """
    **Phase 1** – Upload an image and receive YOLOv8 detection results.

    - Returns each detected waste object with its class label and confidence score.
    - Detections are sorted by confidence (highest first).
    - Returns an empty `detections` list when no objects are found.

    **Example response**
    ```json
    {
      "success": true,
      "detections": [
        { "class": "can",     "confidence": 0.93 },
        { "class": "plastic", "confidence": 0.91 }
      ]
    }
    ```
    """
    _validate_image(file)
    contents = await _read_and_validate_size(file)
    temp_path = _save_temp_file(contents, file.filename or "upload.jpg")

    try:
        detections: List[Dict[str, Any]] = run_inference(temp_path)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"success": True, "detections": detections},
        )

    except FileNotFoundError as exc:
        logger.error("Temp file missing before inference: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Temporary image file was lost before inference could run.",
        )
    except RuntimeError as exc:
        logger.error("YOLO runtime error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {exc}",
        )
    except Exception as exc:
        logger.exception("Unexpected error in /detect: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again.",
        )
    finally:
        _cleanup(temp_path)


@app.post(
    "/audit",
    summary="Full waste audit: detection + statistics + AI report",
    tags=["Phase 2 – Audit"],
    response_model=AuditResponse,
    response_description="Detections, statistics, and AI-generated audit report",
    status_code=status.HTTP_200_OK,
)
async def audit(
    file: UploadFile = File(
        ...,
        description="Image to audit — JPEG, PNG, WEBP, BMP, or TIFF (max 20 MB)",
    ),
) -> JSONResponse:
    """
    **Phase 2** – Full waste audit pipeline.

    1. Runs YOLOv8 detection on the uploaded image.
    2. Aggregates detection counts into waste statistics.
    3. Sends the statistics to **Ollama Cloud** (`gpt-oss:120b`) for analysis.
    4. Returns detections, statistics, and the AI-generated audit report.

    Requires `OLLAMA_API_KEY` to be set in `.env` or the environment.

    **Example response**
    ```json
    {
      "success": true,
      "detections": [
        { "class": "can",     "confidence": 0.93 },
        { "class": "plastic", "confidence": 0.91 },
        { "class": "plastic", "confidence": 0.88 }
      ],
      "statistics": { "plastic": 2, "can": 1 },
      "audit_report": "## Waste Audit Report\\n\\n**1. Waste Summary** ..."
    }
    ```

    **Error codes**
    - `415` – Unsupported image type.
    - `400` – Empty file.
    - `413` – File too large (> 20 MB).
    - `503` – Ollama Cloud is unavailable or API key is invalid.
    - `500` – YOLO inference error or unexpected server fault.
    """
    # ── Step 1: Validate & save ──────────────────────────────────────────────
    _validate_image(file)
    contents = await _read_and_validate_size(file)
    temp_path = _save_temp_file(contents, file.filename or "upload.jpg")

    try:
        # ── Step 2: YOLO inference ─────────────────────────────────────────
        detections: List[Dict[str, Any]] = run_inference(temp_path)

        # ── Step 3: Waste statistics ───────────────────────────────────────
        statistics: WasteStatistics = compute_statistics(detections)

        # ── Step 4: Build LLM prompt ───────────────────────────────────────
        prompt: str = build_audit_prompt(statistics)

        # ── Step 5: Ollama Cloud inference ─────────────────────────────────
        audit_report: str = generate_audit_report(prompt)

        # ── Step 6: Return composite response ─────────────────────────────
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "detections": detections,
                "statistics": statistics,
                "audit_report": audit_report,
            },
        )

    # ── Error handling ───────────────────────────────────────────────────────

    except OllamaServiceError as exc:
        # Ollama is unavailable or mis-configured → 503 Service Unavailable
        logger.error("Ollama Cloud error in /audit: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                f"AI report generation failed: {exc}. "
                "Ensure OLLAMA_API_KEY is set and Ollama Cloud is reachable."
            ),
        )
    except FileNotFoundError as exc:
        logger.error("Temp file missing before YOLO inference: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Temporary image file was lost before inference could run.",
        )
    except RuntimeError as exc:
        logger.error("YOLO runtime error in /audit: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {exc}",
        )
    except Exception as exc:
        logger.exception("Unexpected error in /audit: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again.",
        )
    finally:
        _cleanup(temp_path)
