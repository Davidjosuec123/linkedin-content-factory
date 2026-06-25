def test_extractor_returns_mocked(mock_groq):
    from agents.extractor import run_extractor
    result = run_extractor("transcripción de prueba")
    assert result == "Mocked LLM response"
    mock_groq.chat.completions.create.assert_called_once()


def test_redactor_returns_mocked(mock_groq):
    from agents.redactor import run_redactor
    result = run_redactor("# Estructura del día\n\n## Contexto\nPrueba")
    assert result == "Mocked LLM response"


def test_disenador_returns_mocked(mock_groq):
    from agents.disenador import run_disenador
    result = run_disenador("# Structure", "Post content")
    assert isinstance(result, dict)
    assert result["dark_mode"] is True


def test_disenador_fallback_on_invalid_json(mock_groq):
    mock_groq.chat.completions.create.return_value.choices[0].message.content = "not json"
    from agents.disenador import run_disenador
    result = run_disenador("# Structure", "Post content")
    assert result["dark_mode"] is True
    assert result["neon_accent"] == "#00FF94"
