# Smart Waste Audit System — AI Inference Backend

> **FastAPI + YOLOv8 + Ollama Cloud** — Image upload endpoint that detects waste objects and generates AI-powered environmental audit reports.

---

## Project Structure

```
backend/
├── main.py                     # FastAPI app — all routes & Pydantic models
├── services/
│   ├── __init__.py
│   ├── detector.py             # YOLOv8 model loader & inference runner
│   ├── statistics.py           # Waste aggregation & LLM prompt builder
│   └── ollama_service.py       # Ollama Cloud client (singleton)
├── uploads/                    # Temp image storage (auto-cleaned after each request)
├── .env.example                # Copy → .env and fill in your API key
├── requirements.txt
└── README.md

../model/
└── best.pt                     # Custom-trained YOLOv8 model (required)
```

----

## Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Python | 3.10 |
| pip | 23+ |
| CUDA (optional) | 11.8+ (GPU acceleration) |
| Ollama Cloud account | https://ollama.com |

---

## Setup & Installation

### 1 – Navigate to the backend directory

```bash
cd backend
```

### 2 – Create and activate a virtual environment (recommended)

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3 – Install dependencies

```bash
pip install -r requirements.txt
```

> **Note:** `ultralytics` pulls in PyTorch, torchvision, and OpenCV automatically.
> First install may take several minutes.

### 4 – Ollama Cloud API Key Setup

1. Sign in at **https://ollama.com**
2. Go to **Settings → API Keys** → [https://ollama.com/settings/keys](https://ollama.com/settings/keys)
3. Click **Create new key** — copy the generated key
4. Create your local environment file:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

5. Open `.env` and replace the placeholder:

```env
OLLAMA_API_KEY=your_actual_api_key_here
```

> ⚠️ Never commit `.env` to version control. It is already in `.gitignore`.

---

## Running the Server

```bash
uvicorn main:app --reload
```

The server starts at **http://127.0.0.1:8000**

| URL | Description |
|-----|-------------|
| `http://127.0.0.1:8000/docs` | Swagger / OpenAPI interactive docs |
| `http://127.0.0.1:8000/redoc` | ReDoc documentation |
| `http://127.0.0.1:8000/health` | Liveness probe |

---

## API Reference

### `GET /health`

Liveness probe — returns `200 OK` when the service is ready.

```json
{ "status": "ok", "message": "AI inference service is running." }
```

---

### `POST /detect`  *(Phase 1)*

Upload an image and receive raw YOLOv8 detection results.

**Request**

```
Content-Type: multipart/form-data
Field:        file  (image — JPEG, PNG, WEBP, BMP, TIFF)
Max size:     20 MB
```

**Response `200 OK`**

```json
{
  "success": true,
  "detections": [
    { "class": "can",     "confidence": 0.9300 },
    { "class": "plastic", "confidence": 0.9100 },
    { "class": "plastic", "confidence": 0.8800 }
  ]
}
```

---

### `POST /audit`  *(Phase 2)*

Full waste audit pipeline — detection + statistics + AI report.

**Request**

```
Content-Type: multipart/form-data
Field:        file  (image — JPEG, PNG, WEBP, BMP, TIFF)
Max size:     20 MB
```

**Example curl request**

```bash
curl -X POST "http://127.0.0.1:8000/audit" \
  -H "accept: application/json" \
  -F "file=@/path/to/your/image.jpg"
```

**Example response `200 OK`**

```json
{
  "success": true,
  "detections": [
    { "class": "can",     "confidence": 0.9300 },
    { "class": "plastic", "confidence": 0.9100 },
    { "class": "plastic", "confidence": 0.8800 }
  ],
  "statistics": {
    "plastic": 2,
    "can": 1
  },
  "audit_report": "## Waste Audit Report\n\n**1. Waste Summary**\nTwo plastic items and one aluminium can were detected at the audit site, totalling 3 waste objects...\n\n**2. Waste Classification**\n- Plastic: Recyclable (Category 1–7 depending on resin type)\n- Can: Recyclable aluminium\n\n**3. Recycling Recommendations**\n...\n\n**4. Environmental Impact**\n...\n\n**5. Actionable Suggestions**\n..."
}
```

**Error codes**

| Status | Cause |
|--------|-------|
| `400`  | Empty file uploaded |
| `413`  | File exceeds 20 MB limit |
| `415`  | Unsupported file type or extension |
| `503`  | Ollama Cloud unreachable or `OLLAMA_API_KEY` invalid/missing |
| `500`  | YOLO inference error or unexpected server fault |

---

## Testing via Swagger UI

1. Open **http://127.0.0.1:8000/docs**
2. Choose **POST /audit → Try it out**
3. Upload an image using the file chooser
4. Click **Execute** and inspect the full response

---

## Pipeline Architecture

```
HTTP Request (multipart image)
         │
         ▼
  ┌─────────────┐
  │  Validation  │  ← MIME type, extension, file size
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  YOLOv8     │  ← detector.py  (best.pt loaded once at startup)
  │  Inference  │
  └──────┬──────┘
         │  detections: [{class, confidence}, ...]
         ▼
  ┌─────────────┐
  │  Statistics │  ← statistics.py  (pure aggregation)
  │  Aggregation│
  └──────┬──────┘
         │  statistics: {plastic: 2, can: 1}
         ▼
  ┌─────────────┐
  │ Prompt Build│  ← statistics.build_audit_prompt()
  └──────┬──────┘
         │  structured natural-language prompt
         ▼
  ┌─────────────┐
  │ Ollama Cloud│  ← ollama_service.py  (gpt-oss:120b)
  │  gpt-oss    │
  └──────┬──────┘
         │  audit_report: "..."
         ▼
  JSON Response  {success, detections, statistics, audit_report}
```

---

## Configuration

| Setting | Default | How to change |
|---------|---------|---------------|
| Model path | `../model/best.pt` | Edit `MODEL_PATH` in `services/detector.py` |
| Ollama model | `gpt-oss:120b` | Edit `OLLAMA_MODEL` in `services/ollama_service.py` |
| Ollama host | `https://ollama.com` | Edit `OLLAMA_CLOUD_HOST` in `services/ollama_service.py` |
| Upload dir | `backend/uploads/` | Edit `UPLOAD_DIR` in `main.py` |
| Max file size | 20 MB | Edit `MAX_FILE_SIZE_BYTES` in `main.py` |
| CORS origin | `http://localhost:3000` | Edit `allow_origins` in `main.py` |
| Server port | `8000` | Pass `--port <N>` to `uvicorn` |

---

## Notes

- Uploaded images are **automatically deleted** after each request — nothing is persisted.
- The YOLO model is loaded **once at startup** — zero overhead per-request.
- GPU is used automatically when CUDA is available; falls back to CPU otherwise.
- The `/audit` endpoint returns HTTP **503** (not 500) when Ollama is unavailable,
  allowing the frontend to handle LLM outages gracefully without hiding YOLO results.
- The `/detect` endpoint remains fully functional even without an Ollama API key.
