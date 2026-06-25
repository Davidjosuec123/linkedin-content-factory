import os
import tempfile
import pytest
from unittest.mock import MagicMock

os.environ.setdefault("GROQ_API_KEY", "test-api-key")
os.environ.setdefault("WHISPER_MODEL", "tiny")

from fastapi.testclient import TestClient
from main import app
from config import settings
import database


@pytest.fixture(autouse=True)
def test_db():
    tmp_file = tempfile.mktemp(suffix=".test.db")
    old_db_url = settings.database_url
    settings.database_url = f"sqlite:///{tmp_file}"
    database.DB_PATH = tmp_file
    database.init_db()
    yield
    settings.database_url = old_db_url
    if os.path.exists(tmp_file):
        os.unlink(tmp_file)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def mock_groq(mocker):
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "Mocked LLM response"
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = mock_response
    mocker.patch("agents.base.client", mock_client)
    return mock_client


@pytest.fixture
def mock_whisper(mocker):
    segment = MagicMock()
    segment.text = "Hoy trabajé en un flujo de n8n para un cliente inmobiliario. El webhook no manejaba respuestas vacías de Messenger y los leads se perdían."
    mock_model = MagicMock()
    mock_model.transcribe.return_value = ([segment], MagicMock())
    mocker.patch("transcription.WhisperModel", return_value=mock_model)
    return mock_model


@pytest.fixture
def mock_full_pipeline(mock_groq, mock_whisper):
    pass


@pytest.fixture
def sample_audio_bytes():
    return b"\x00\x01\x02\x03" * 1000
