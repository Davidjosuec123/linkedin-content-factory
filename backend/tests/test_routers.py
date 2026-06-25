def test_process_audio_success(client, mock_full_pipeline, sample_audio_bytes):
    response = client.post(
        "/api/process",
        files={"file": ("test.mp3", sample_audio_bytes, "audio/mpeg")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] is not None
    assert data["raw_structure"] == "Mocked LLM response"
    assert data["linkedin_post"] == "Mocked LLM response"
    assert data["design_guide"]["dark_mode"] is True


def test_process_audio_no_file(client):
    response = client.post("/api/process")
    assert response.status_code == 422


def test_process_audio_invalid_extension(client, sample_audio_bytes):
    response = client.post(
        "/api/process",
        files={"file": ("test.pdf", sample_audio_bytes, "application/pdf")},
    )
    assert response.status_code == 400
    assert "no soportado" in response.json()["detail"].lower()


def test_process_audio_too_large(client):
    big_data = b"x" * (21 * 1024 * 1024)
    response = client.post(
        "/api/process",
        files={"file": ("big.mp3", big_data, "audio/mpeg")},
    )
    assert response.status_code == 400
    assert "grande" in response.json()["detail"].lower()


def test_list_sessions(client):
    response = client.get("/api/sessions")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_session_not_found(client):
    response = client.get("/api/sessions/nonexistent")
    assert response.status_code == 404


def test_get_session_processing(client):
    from database import save_session
    save_session("proc-1", "audio.mp3")
    response = client.get("/api/sessions/proc-1")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "processing"


def test_get_session_completed(client, mock_full_pipeline, sample_audio_bytes):
    proc_resp = client.post(
        "/api/process",
        files={"file": ("test.mp3", sample_audio_bytes, "audio/mpeg")},
    )
    sid = proc_resp.json()["session_id"]
    response = client.get(f"/api/sessions/{sid}")
    assert response.status_code == 200
    data = response.json()
    assert data["linkedin_post"] is not None
