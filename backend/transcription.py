import whisper
from config import settings

_model = None


def get_model():
    global _model
    if _model is None:
        _model = whisper.load_model(settings.whisper_model)
    return _model


def transcribe_audio(audio_path: str) -> str:
    model = get_model()
    result = model.transcribe(audio_path, language="es")
    return result["text"].strip()
