"""
detector.py
-----------
Singleton service that loads the YOLOv8 model once at startup and exposes
a single `run_inference` function for the API layer.
"""

import os
import logging
from pathlib import Path
from typing import List, Dict, Any

from ultralytics import YOLO

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model path — relative to this file: ../../model/best.pt
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent          # backend/
MODEL_PATH = BASE_DIR.parent / "model" / "best.pt"         # ../model/best.pt


# ---------------------------------------------------------------------------
# Module-level singleton so the model is loaded exactly once
# ---------------------------------------------------------------------------
_model: YOLO | None = None


def load_model() -> None:
    """
    Load the YOLOv8 model from disk.
    Called once during application startup via FastAPI lifespan.
    Raises FileNotFoundError if the model file is missing.
    """
    global _model

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"YOLOv8 model not found at: {MODEL_PATH}\n"
            "Make sure 'best.pt' is placed inside the 'model/' directory."
        )

    logger.info("Loading YOLOv8 model from: %s", MODEL_PATH)
    _model = YOLO(str(MODEL_PATH))
    logger.info("Model loaded successfully. Classes: %s", list(_model.names.values()))


def get_model() -> YOLO:
    """Return the loaded model, raising RuntimeError if not yet initialised."""
    if _model is None:
        raise RuntimeError(
            "YOLOv8 model has not been loaded. "
            "Ensure 'load_model()' is called during application startup."
        )
    return _model


# ---------------------------------------------------------------------------
# Inference
# ---------------------------------------------------------------------------
def run_inference(image_path: str | Path) -> List[Dict[str, Any]]:
    """
    Run YOLOv8 inference on *image_path* and return a list of detections.

    Parameters
    ----------
    image_path : str | Path
        Absolute or relative path to the image file.

    Returns
    -------
    list of dict
        Each dict has:
        - ``class``      (str)   – human-readable class label
        - ``confidence`` (float) – confidence score rounded to 4 decimal places

    Raises
    ------
    FileNotFoundError
        If *image_path* does not exist.
    RuntimeError
        If the model has not been loaded.
    """
    image_path = Path(image_path)
    if not image_path.exists():
        raise FileNotFoundError(f"Image file not found: {image_path}")

    model = get_model()

    logger.info("Running inference on: %s", image_path.name)

    # Run inference — verbose=False suppresses YOLO's own console output
    results = model(str(image_path), verbose=False)

    detections: List[Dict[str, Any]] = []

    for result in results:
        boxes = result.boxes
        if boxes is None:
            continue

        for box in boxes:
            class_id = int(box.cls[0])
            class_name: str = model.names.get(class_id, f"class_{class_id}")
            confidence: float = round(float(box.conf[0]), 4)

            detections.append(
                {
                    "class": class_name,
                    "confidence": confidence,
                }
            )

    # Sort by confidence descending so the most-confident detections come first
    detections.sort(key=lambda d: d["confidence"], reverse=True)

    logger.info("Detected %d object(s) in '%s'", len(detections), image_path.name)
    return detections
