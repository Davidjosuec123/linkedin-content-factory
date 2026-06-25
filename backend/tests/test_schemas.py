from schemas import DesignGuide, SessionResponse, SessionSummary, ErrorResponse


def test_design_guide_defaults():
    dg = DesignGuide()
    assert dg.dark_mode is True
    assert dg.neon_accent == "#00FF94"
    assert dg.suggested_tools == []
    assert dg.screenshot_count == 0


def test_design_guide_custom():
    dg = DesignGuide(
        suggested_tools=["n8n", "Airtable"],
        screenshot_count=2,
        neon_accent="#00E5FF",
    )
    assert dg.suggested_tools == ["n8n", "Airtable"]
    assert dg.screenshot_count == 2
    assert dg.neon_accent == "#00E5FF"


def test_session_response():
    sr = SessionResponse(
        session_id="abc-123",
        timestamp="2026-06-25T00:00:00",
        raw_structure="# Markdown",
        linkedin_post="Post content",
        design_guide=DesignGuide(),
    )
    assert sr.session_id == "abc-123"
    assert sr.design_guide.dark_mode is True


def test_session_summary():
    ss = SessionSummary(
        session_id="abc-123",
        timestamp="2026-06-25T00:00:00",
        status="completed",
        title="Test session",
    )
    assert ss.title == "Test session"
    assert ss.status == "completed"


def test_error_response():
    er = ErrorResponse(detail="Something broke", session_id="abc-123")
    assert er.detail == "Something broke"
    assert er.raw_structure is None
