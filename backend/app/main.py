"""FastAPI control and telemetry surface for the security camera dashboard."""

from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .state import RuntimeMode, runtime_store


class ModeRequest(BaseModel):
    mode: Literal["DISARMED", "AUTO", "MANUAL"]


class ManualCommand(BaseModel):
    pan_delta_us: int = Field(default=0, ge=-35, le=35)
    tilt_delta_us: int = Field(default=0, ge=-35, le=35)


app = FastAPI(title="Security Camera API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/status")
async def status() -> dict[str, object]:
    return await runtime_store.snapshot()


@app.get("/api/video/status")
async def video_status() -> dict[str, object]:
    return {"available": False, "message": "Camera worker not connected yet."}


@app.post("/api/system/arm")
async def arm() -> dict[str, object]:
    return await runtime_store.arm()


@app.post("/api/system/disarm")
async def disarm() -> dict[str, object]:
    return await runtime_store.disarm()


@app.post("/api/control/mode")
async def set_mode(request: ModeRequest) -> dict[str, object]:
    return await runtime_store.set_mode(RuntimeMode(request.mode))


@app.post("/api/control/manual")
async def manual_command(command: ManualCommand) -> dict[str, object]:
    status = await runtime_store.manual(command.pan_delta_us, command.tilt_delta_us)
    return {"accepted": True, "command": command.model_dump(), "status": status}


@app.post("/api/control/center")
async def center() -> dict[str, object]:
    return await runtime_store.center()


@app.websocket("/ws/telemetry")
async def telemetry(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            await websocket.send_json(await runtime_store.snapshot())
            await asyncio.sleep(0.25)
    except Exception:
        await websocket.close()


dashboard_dir = Path(__file__).resolve().parents[2] / "frontend"
app.mount("/dashboard", StaticFiles(directory=dashboard_dir, html=True), name="dashboard")
