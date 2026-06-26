from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    max_tokens_extractor: int = 1500
    max_tokens_redactor: int = 800
    max_tokens_designer: int = 600
    temperature_extractor: float = 0.2
    temperature_redactor: float = 0.7
    temperature_designer: float = 0.3
    database_url: str = "sqlite:///./content_factory.db"
    whisper_model: str = "base"


settings = Settings()
