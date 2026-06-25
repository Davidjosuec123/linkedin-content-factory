from faster_whisper import WhisperModel
from config import settings

_model = None


def get_model():
    global _model
    if _model is None:
        _model = WhisperModel(
            settings.whisper_model,
            device="cpu",
            compute_type="int8",
        )
    return _model


def transcribe_audio(audio_path: str) -> str:
    model = get_model()
    segments, _ = model.transcribe(audio_path, language="es")
    return " ".join(seg.text for seg in segments).strip()
