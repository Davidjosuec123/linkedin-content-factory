from fastapi import APIRouter, HTTPException
from database import get_session, list_sessions
from schemas import SessionResponse, DesignGuide, SessionSummary
import json

router = APIRouter()


@router.get("/sessions")
async def get_sessions(limit: int = 20):
    rows = list_sessions(limit)
    return [SessionSummary(**r).model_dump() for r in rows]


@router.get("/sessions/{session_id}")
async def get_session_by_id(session_id: str):
    row = get_session(session_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if row["status"] == "completed":
        design_guide = json.loads(row["design_guide"]) if row["design_guide"] else {}
        return SessionResponse(
            session_id=row["session_id"],
            timestamp=row["timestamp"],
            raw_structure=row["raw_structure"] or "",
            linkedin_post=row["linkedin_post"] or "",
            design_guide=DesignGuide(**design_guide),
        ).model_dump()
    elif row["status"] == "error":
        return {
            "session_id": row["session_id"],
            "timestamp": row["timestamp"],
            "status": "error",
            "detail": row["error_message"],
            "raw_structure": row["raw_structure"],
        }
    else:
        return {
            "session_id": row["session_id"],
            "timestamp": row["timestamp"],
            "status": "processing",
        }
