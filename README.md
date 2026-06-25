# LinkedIn Content Factory — Acacia Systems

Pipeline de 3 agentes IA que transforma audios diarios de David Josué Camejo Ortega en contenido de LinkedIn de alto impacto.

## Arquitectura

```
Audio → Whisper → Extractor (TOC) → Redactor (LinkedIn) → Diseñador (visual)
         → SQLite → Frontend Next.js
```

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI + Groq (Llama 3.3-70B) |
| Transcripción | OpenAI Whisper |
| Base de datos | SQLite |
| Frontend | Next.js 14 + React 18 + Tailwind |
| Infra | Docker Compose / EasyPanel (Hetzner) |

## Setup local

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # editar GROQ_API_KEY
uvicorn main:app --reload

# Frontend
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

## Docker

```bash
docker compose up --build
```

Backend en `http://localhost:8000`, frontend en `http://localhost:3000`.

## Tests

```bash
cd backend
source .venv/bin/activate
python -m pytest tests/ -v
```

## Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/process` | Subir audio → pipeline completo |
| `GET` | `/api/sessions` | Listar sesiones |
| `GET` | `/api/sessions/{id}` | Detalle de sesión |
| `GET` | `/health` | Health check |

## Agentes

1. **Extractor** — limpia transcripción, redacta PII, extrae cuello de botella (TOC), estructura Markdown
2. **Redactor** — escribe post LinkedIn (estilo MBA + Extreme Ownership + LinkedIn Sales Authority)
3. **Diseñador** — genera guía visual dark mode + neón para capturas de pantalla
