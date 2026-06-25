from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DesignGuide(BaseModel):
    suggested_tools: list[str] = []
    visual_artifacts: list[dict] = []
    blur_zones: list[str] = []
    post_production_notes: str = ""
    screenshot_count: int = 0
    dark_mode: bool = True
    neon_accent: str = "#00FF94"
    screenshot_notes: str = ""


class SessionResponse(BaseModel):
    session_id: str
    timestamp: str
    raw_structure: str
    linkedin_post: str
    design_guide: DesignGuide


class SessionSummary(BaseModel):
    session_id: str
    timestamp: str
    status: str
    title: str = ""


class ErrorResponse(BaseModel):
    detail: str
    session_id: Optional[str] = None
    raw_structure: Optional[str] = None
