# Smart Waste Audit System

A full-stack AI-powered waste detection and environmental audit platform built with YOLOv8, Ollama Cloud LLM, FastAPI, and Next.js.

Upload an image of waste and the system automatically detects waste objects, aggregates statistics, and generates a structured environmental audit report using a large language model.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Object Detection | YOLOv8 (custom-trained `best.pt`) |
| AI Audit Report | Ollama Cloud (`gpt-oss:120b`) |
| Backend API | FastAPI + Uvicorn |
| Frontend | Next.js 16 + TypeScript + Tailwind CSS |
| Charts | Recharts |
| Deployment | Vercel (monorepo) |

---

## Project Structure

```
smart-waste-audit-system/
├── backend/
│   ├── main.py                  # FastAPI app — all routes and Pydantic models
│   ├── services/
│   │   ├── detector.py          # YOLOv8 model loader and inference runner
│   │   ├── statistics.py        # Waste aggregation and LLM prompt builder
│   │   └── ollama_service.py    # Ollama Cloud client (singleton)
│   ├── uploads/                 # Temp image storage (auto-cleaned after each request)
│   ├── .env.example             # Copy to .env and fill in your API key
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages
│   │   ├── components/          # UI components (upload card, charts, audit report, etc.)
│   │   ├── lib/                 # API client utilities
│   │   └── types/               # TypeScript type definitions
│   └── package.json
├── model/
│   └── best.pt                  # Custom-trained YOLOv8 model weights
└── vercel.json                  # Vercel monorepo deployment config
```

---

## How It Works

The system runs a two-phase AI pipeline on every uploaded image:

**Phase 1 — Detection** (`POST /api/detect`)

1. The uploaded image is validated (type, size) and temporarily saved.
2. A custom-trained YOLOv8 model (`best.pt`) runs inference and returns detected waste objects with confidence scores.
3. The temporary file is deleted immediately after inference.

**Phase 2 — Full Audit** (`POST /api/audit`)

1. Steps 1–2 from Phase 1.
2. Detection results are aggregated into per-class waste statistics.
3. A structured natural-language prompt is built from the statistics.
4. The prompt is sent to **Ollama Cloud** (`gpt-oss:120b`) which returns a full environmental audit report.
5. Detections, statistics, and the audit report are returned as a single JSON response.

```
HTTP Request (multipart image)
         |
         v
  +--------------+
  |  Validation  |  -- MIME type, extension, file size
  +--------------+
         |
         v
  +--------------+
  |   YOLOv8    |  -- detector.py  (best.pt loaded once at startup)
  |  Inference  |
  +--------------+
         |  detections: [{class, confidence}, ...]
         v
  +--------------+
  |  Statistics  |  -- statistics.py  (pure aggregation)
  | Aggregation  |
  +--------------+
         |  statistics: {plastic: 2, can: 1}
         v
  +--------------+
  | Prompt Build |  -- statistics.build_audit_prompt()
  +--------------+
         |  structured natural-language prompt
         v
  +--------------+
  | Ollama Cloud |  -- ollama_service.py  (gpt-oss:120b)
  |  gpt-oss    |
  +--------------+
         |  audit_report: "..."
         v
  JSON Response  {success, detections, statistics, audit_report}
```

---

## Prerequisites

| Tool | Minimum Version |
|---|---|
| Python | 3.10 |
| Node.js | 18 |
| pip | 23+ |
| CUDA (optional) | 11.8+ (GPU acceleration) |
| Ollama Cloud account | https://ollama.com |

---

## Local Development

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Configure environment variables:**

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Open `.env` and set your Ollama Cloud API key:

```env
OLLAMA_API_KEY=your_api_key_here
```

Get your API key from: https://ollama.com/settings/keys

**Start the backend server:**

```bash
uvicorn main:app --reload
```

The server starts at `http://127.0.0.1:8000`

| URL | Description |
|---|---|
| `http://127.0.0.1:8000/docs` | Swagger / OpenAPI interactive docs |
| `http://127.0.0.1:8000/redoc` | ReDoc documentation |
| `http://127.0.0.1:8000/health` | Liveness probe |

---

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend starts at `http://localhost:3000`

---

## API Reference

### GET /health

Liveness probe — returns `200 OK` when the model is loaded and the service is ready.

```json
{ "status": "ok", "message": "AI inference service is running." }
```

---

### POST /detect

Upload an image and receive raw YOLOv8 detection results.

**Request**

```
Content-Type: multipart/form-data
Field:        file  (image — JPEG, PNG, WEBP, BMP, TIFF, max 20 MB)
```

**Response 200 OK**

```json
{
  "success": true,
  "detections": [
    { "class": "can",     "confidence": 0.93 },
    { "class": "plastic", "confidence": 0.91 }
  ]
}
```

---

### POST /audit

Full waste audit pipeline — detection + statistics + AI-generated report.

**Request**

```
Content-Type: multipart/form-data
Field:        file  (image — JPEG, PNG, WEBP, BMP, TIFF, max 20 MB)
```

**Example curl**

```bash
curl -X POST "http://127.0.0.1:8000/audit" \
  -H "accept: application/json" \
  -F "file=@/path/to/image.jpg"
```

**Response 200 OK**

```json
{
  "success": true,
  "detections": [
    { "class": "can",     "confidence": 0.93 },
    { "class": "plastic", "confidence": 0.91 },
    { "class": "plastic", "confidence": 0.88 }
  ],
  "statistics": {
    "plastic": 2,
    "can": 1
  },
  "audit_report": "## Waste Audit Report\n\n**1. Waste Summary**\n..."
}
```

**Error codes**

| Status | Cause |
|---|---|
| `400` | Empty file uploaded |
| `413` | File exceeds 20 MB |
| `415` | Unsupported file type or extension |
| `503` | Ollama Cloud unreachable or API key invalid |
| `500` | YOLO inference error or unexpected server fault |

---

## Configuration

| Setting | Default | How to change |
|---|---|---|
| Model path | `../model/best.pt` | Edit `MODEL_PATH` in `services/detector.py` |
| Ollama model | `gpt-oss:120b` | Edit `OLLAMA_MODEL` in `services/ollama_service.py` |
| Ollama host | `https://ollama.com` | Edit `OLLAMA_CLOUD_HOST` in `services/ollama_service.py` |
| Upload dir | `backend/uploads/` | Edit `UPLOAD_DIR` in `main.py` |
| Max file size | 20 MB | Edit `MAX_FILE_SIZE_BYTES` in `main.py` |
| CORS origin | `http://localhost:3000` | Edit `allow_origins` in `main.py` |
| Server port | `8000` | Pass `--port N` to uvicorn |

---

## Deployment (Vercel)

This project is configured for Vercel monorepo deployment via `vercel.json`. The frontend and backend are deployed as separate services from the same repository.

```json
{
  "experimentalServices": {
    "frontend": {
      "root": "frontend",
      "framework": "nextjs",
      "routePrefix": "/"
    },
    "backend": {
      "root": "backend",
      "framework": "fastapi",
      "entrypoint": "main.py",
      "routePrefix": "/api"
    }
  }
}
```

Set `OLLAMA_API_KEY` in your Vercel project environment variables before deploying.

---

## Notes

- Uploaded images are automatically deleted after each request — nothing is persisted.
- The YOLOv8 model (`best.pt`) is loaded once at startup, resulting in zero overhead per request.
- GPU is used automatically when CUDA is available; falls back to CPU otherwise.
- The `/audit` endpoint returns HTTP `503` (not `500`) when Ollama is unavailable, allowing the frontend to handle LLM outages gracefully.
- The `/detect` endpoint remains fully functional without an Ollama API key.
- The `OLLAMA_API_KEY` in `.env` is excluded from version control via `.gitignore`.

---

## License

MIT
