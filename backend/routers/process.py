import os
import json
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pipeline import run_pipeline, run_pipeline_streaming

router = APIRouter()

MAX_FILE_SIZE = 20 * 1024 * 1024
ALLOWED_MIME_TYPES = {
    "audio/mpeg",
    "audio/wav",
    "audio/webm",
    "audio/ogg",
    "audio/x-m4a",
    "audio/mp4",
    "audio/x-wav",
}

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".webm", ".ogg", ".m4a", ".mp4"}


async def _sse_stream(audio_path: str, filename: str):
    try:
        async for event in run_pipeline_streaming(audio_path, filename):
            yield f"data: {json.dumps(event)}\n\n"
    finally:
        if os.path.exists(audio_path):
            os.unlink(audio_path)


@router.post("/process/stream")
async def process_audio_stream(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato no soportado: {ext}. Permitidos: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )
    suffix = ext or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            os.unlink(tmp.name)
            raise HTTPException(
                status_code=400,
                detail=f"Archivo demasiado grande ({len(content) / 1024 / 1024:.1f}MB). Máximo: {MAX_FILE_SIZE / 1024 / 1024:.0f}MB",
            )
        tmp.write(content)
        audio_path = tmp.name
    return StreamingResponse(
        _sse_stream(audio_path, file.filename),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/process")
async def process_audio(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato no soportado: {ext}. Permitidos: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    suffix = ext or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            os.unlink(tmp.name)
            raise HTTPException(
                status_code=400,
                detail=f"Archivo demasiado grande ({len(content) / 1024 / 1024:.1f}MB). Máximo: {MAX_FILE_SIZE / 1024 / 1024:.0f}MB",
            )
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = await run_pipeline(tmp_path, file.filename)
        return result
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
