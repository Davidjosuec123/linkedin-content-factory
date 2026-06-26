import uuid
import json
import logging
from datetime import datetime, timezone
from typing import Optional

from transcription import transcribe_audio
from agents.extractor import run_extractor
from agents.redactor import run_redactor
from agents.disenador import run_disenador
from database import (
    save_session,
    update_session_success,
    update_session_error,
    get_session,
)
from schemas import SessionResponse, DesignGuide, ErrorResponse

logger = logging.getLogger("linkedin-content-factory")


def _build_result(session_id, raw_structure, linkedin_post, design_guide):
    update_session_success(session_id, raw_structure, linkedin_post, design_guide)
    logger.info("[%s] Pipeline completed successfully", session_id)
    return SessionResponse(
        session_id=session_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        raw_structure=raw_structure,
        linkedin_post=linkedin_post,
        design_guide=DesignGuide(**design_guide),
    ).model_dump()


async def run_pipeline(audio_path: str, audio_filename: str) -> dict:
    session_id = str(uuid.uuid4())
    save_session(session_id, audio_filename)
    logger.info("[%s] Pipeline started | file=%s", session_id, audio_filename)

    try:
        transcription = transcribe_audio(audio_path)
        logger.info("[%s] Stage 1/4: Transcription done (%d chars)", session_id, len(transcription))

        try:
            raw_structure = run_extractor(transcription)
            logger.info("[%s] Stage 2/4: Extractor done (%d chars)", session_id, len(raw_structure))
        except Exception as e:
            error_msg = f"Extractor failed: {str(e)}"
            logger.error("[%s] Stage 2/4: %s", session_id, error_msg)
            update_session_error(session_id, error_msg)
            return ErrorResponse(detail=error_msg, session_id=session_id).model_dump()

        try:
            linkedin_post = run_redactor(raw_structure)
            logger.info("[%s] Stage 3/4: Redactor done (%d chars)", session_id, len(linkedin_post))
        except Exception as e:
            error_msg = f"Redactor failed: {str(e)}"
            logger.error("[%s] Stage 3/4: %s", session_id, error_msg)
            update_session_error(session_id, error_msg, raw_structure)
            return ErrorResponse(detail=error_msg, session_id=session_id, raw_structure=raw_structure).model_dump()

        design_guide = run_disenador(raw_structure, linkedin_post)
        logger.info("[%s] Stage 4/4: Disenador done", session_id)

        return _build_result(session_id, raw_structure, linkedin_post, design_guide)

    except Exception as e:
        error_msg = f"Pipeline failed: {str(e)}"
        logger.error("[%s] Pipeline failed: %s", session_id, error_msg)
        update_session_error(session_id, error_msg)
        return ErrorResponse(detail=error_msg, session_id=session_id).model_dump()


async def run_pipeline_streaming(audio_path: str, audio_filename: str):
    session_id = str(uuid.uuid4())
    save_session(session_id, audio_filename)
    yield {"stage": "session", "status": "done", "session_id": session_id}
    logger.info("[%s] Pipeline started | file=%s", session_id, audio_filename)

    try:
        yield {"stage": "transcription", "status": "processing"}
        transcription = transcribe_audio(audio_path)
        yield {"stage": "transcription", "status": "done"}
        logger.info("[%s] Stage 1/4: Transcription done (%d chars)", session_id, len(transcription))

        yield {"stage": "extractor", "status": "processing"}
        try:
            raw_structure = run_extractor(transcription)
            yield {"stage": "extractor", "status": "done"}
            logger.info("[%s] Stage 2/4: Extractor done (%d chars)", session_id, len(raw_structure))
        except Exception as e:
            error_msg = f"Extractor failed: {str(e)}"
            logger.error("[%s] Stage 2/4: %s", session_id, error_msg)
            update_session_error(session_id, error_msg)
            yield {"stage": "extractor", "status": "error", "error": error_msg}
            return

        yield {"stage": "redactor", "status": "processing"}
        try:
            linkedin_post = run_redactor(raw_structure)
            yield {"stage": "redactor", "status": "done"}
            logger.info("[%s] Stage 3/4: Redactor done (%d chars)", session_id, len(linkedin_post))
        except Exception as e:
            error_msg = f"Redactor failed: {str(e)}"
            logger.error("[%s] Stage 3/4: %s", session_id, error_msg)
            update_session_error(session_id, error_msg, raw_structure)
            yield {"stage": "redactor", "status": "error", "error": error_msg, "raw_structure": raw_structure}
            return

        yield {"stage": "disenador", "status": "processing"}
        design_guide = run_disenador(raw_structure, linkedin_post)
        yield {"stage": "disenador", "status": "done"}
        logger.info("[%s] Stage 4/4: Disenador done", session_id)

        result = _build_result(session_id, raw_structure, linkedin_post, design_guide)
        yield {"stage": "complete", "status": "done", "result": result}

    except Exception as e:
        error_msg = f"Pipeline failed: {str(e)}"
        logger.error("[%s] Pipeline failed: %s", session_id, error_msg)
        update_session_error(session_id, error_msg)
        yield {"stage": "error", "status": "error", "error": error_msg}
