import json
from database import (
    save_session,
    get_session,
    list_sessions,
    update_session_success,
    update_session_error,
    extract_title,
)


def test_save_and_get_session():
    session_id = "test-123"
    save_session(session_id, "audio.mp3")
    session = get_session(session_id)
    assert session is not None
    assert session["session_id"] == session_id
    assert session["status"] == "processing"
    assert session["audio_filename"] == "audio.mp3"


def test_get_nonexistent_session():
    assert get_session("nonexistent") is None


def test_update_session_success():
    session_id = "test-456"
    save_session(session_id, "test.wav")
    raw = "# Estructura del Día\n\n## Contexto\nCliente inmobiliario con problemas de webhook"
    post = "Post de prueba"
    guide = {"dark_mode": True, "neon_accent": "#00FF94"}
    update_session_success(session_id, raw, post, guide)
    session = get_session(session_id)
    assert session["status"] == "completed"
    assert session["raw_structure"] == raw
    assert session["linkedin_post"] == post
    assert json.loads(session["design_guide"]) == guide
    assert session["title"] == "Cliente inmobiliario con problemas de webhook"


def test_update_session_error():
    session_id = "test-789"
    save_session(session_id, "test.ogg")
    update_session_error(session_id, "Extractor failed", "some raw structure")
    session = get_session(session_id)
    assert session["status"] == "error"
    assert session["error_message"] == "Extractor failed"


def test_list_sessions():
    save_session("list-1", "a.mp3")
    save_session("list-2", "b.mp3")
    sessions = list_sessions(limit=10)
    ids = [s["session_id"] for s in sessions]
    assert "list-1" in ids
    assert "list-2" in ids


def test_extract_title_with_context():
    raw = "# Estructura del Día\n\n## Contexto\nAutomatización de leads para clínica estética\n\n## Restricción"
    assert extract_title(raw) == "Automatización de leads para clínica estética"


def test_extract_title_empty():
    assert extract_title("") == ""
    assert extract_title("# No context section") == ""
