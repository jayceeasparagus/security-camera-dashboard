from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_arm_and_center() -> None:
    armed = client.post("/api/system/arm")
    assert armed.status_code == 200
    assert armed.json()["armed"] is True
    assert armed.json()["mode"] == "AUTO"

    centered = client.post("/api/control/center")
    assert centered.status_code == 200
    assert centered.json()["pan_us"] == 1500
