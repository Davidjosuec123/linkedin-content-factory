import sqlite3
import json
import re
from datetime import datetime, timezone
from typing import Optional
from config import settings

DB_PATH = settings.database_url.replace("sqlite:///", "")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT UNIQUE NOT NULL,
            timestamp TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'processing',
            audio_filename TEXT,
            raw_structure TEXT,
            linkedin_post TEXT,
            design_guide TEXT,
            error_message TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    try:
        conn.execute("ALTER TABLE sessions ADD COLUMN title TEXT DEFAULT ''")
    except sqlite3.OperationalError:
        pass
    conn.commit()
    conn.close()


def save_session(session_id: str, audio_filename: str):
    conn = get_connection()
    conn.execute(
        "INSERT INTO sessions (session_id, timestamp, status, audio_filename) VALUES (?, ?, ?, ?)",
        (session_id, datetime.now(timezone.utc).isoformat(), "processing", audio_filename),
    )
    conn.commit()
    conn.close()


def extract_title(raw_structure: str) -> str:
    if not raw_structure:
        return ""
    match = re.search(r"## Contexto\s*\n\s*(.+)", raw_structure, re.DOTALL)
    if match:
        title = match.group(1).split("\n")[0].strip()
        if len(title) > 100:
            title = title[:97] + "..."
        return title
    return ""


def update_session_success(
    session_id: str,
    raw_structure: str,
    linkedin_post: str,
    design_guide: dict,
):
    conn = get_connection()
    title = extract_title(raw_structure)
    conn.execute(
        """UPDATE sessions
           SET status = 'completed',
               raw_structure = ?,
               linkedin_post = ?,
               design_guide = ?,
               title = ?
           WHERE session_id = ?""",
        (raw_structure, linkedin_post, json.dumps(design_guide), title, session_id),
    )
    conn.commit()
    conn.close()


def update_session_error(session_id: str, error_message: str, raw_structure: Optional[str] = None):
    conn = get_connection()
    title = extract_title(raw_structure) if raw_structure else ""
    conn.execute(
        """UPDATE sessions
           SET status = 'error',
               error_message = ?,
               raw_structure = ?,
               title = ?
           WHERE session_id = ?""",
        (error_message, raw_structure, title, session_id),
    )
    conn.commit()
    conn.close()


def get_session(session_id: str) -> Optional[dict]:
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM sessions WHERE session_id = ?", (session_id,)
    ).fetchone()
    conn.close()
    if row is None:
        return None
    return dict(row)


def list_sessions(limit: int = 20) -> list[dict]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT session_id, timestamp, status, title FROM sessions ORDER BY created_at DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
