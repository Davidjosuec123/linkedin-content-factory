import pytest
import agents.base


def mock_llm_response(text):
    class Choice:
        def __init__(self):
            self.message = self
            self.content = text
    class Response:
        def __init__(self):
            self.choices = [Choice()]
    return Response()


@pytest.mark.asyncio
async def test_pipeline_success(mock_groq, mock_whisper):
    from pipeline import run_pipeline
    result = await run_pipeline("/fake/path.mp3", "test.mp3")
    assert result["session_id"] is not None
    assert result["raw_structure"] == "Mocked LLM response"
    assert result["linkedin_post"] == "Mocked LLM response"
    assert result["design_guide"]["dark_mode"] is True


@pytest.mark.asyncio
async def test_pipeline_extractor_failure(mock_groq, mock_whisper):
    agents.base.client.chat.completions.create.side_effect = Exception("LLM error")
    from pipeline import run_pipeline
    result = await run_pipeline("/fake/path.mp3", "test.mp3")
    assert "error" in result.get("detail", "")


@pytest.mark.asyncio
async def test_pipeline_redactor_failure(mock_groq, mock_whisper):
    call_count = [0]
    original = agents.base.client.chat.completions.create
    def side_effect(*args, **kwargs):
        call_count[0] += 1
        if call_count[0] == 2:
            raise Exception("Redactor error")
        return original(*args, **kwargs)
    agents.base.client.chat.completions.create = side_effect
    from pipeline import run_pipeline
    result = await run_pipeline("/fake/path.mp3", "test.mp3")
    assert result["session_id"] is not None
    assert "raw_structure" in result
