"""In-memory runtime state used by the API until device integration is added."""

from __future__ import annotations

import asyncio
from dataclasses import asdict, dataclass
from enum import Enum


class RuntimeMode(str, Enum):
    DISARMED = "DISARMED"
    AUTO = "AUTO"
    MANUAL = "MANUAL"


class TrackingState(str, Enum):
    IDLE = "IDLE"
    SEARCHING = "SEARCHING"
    TRACKING = "TRACKING"
    HOLD = "HOLD"
    FAULT = "FAULT"


@dataclass
class RuntimeStatus:
    armed: bool = False
    mode: RuntimeMode = RuntimeMode.DISARMED
    tracking_state: TrackingState = TrackingState.IDLE
    target_id: int | None = None
    confidence: float = 0.0
    error_x: int = 0
    error_y: int = 0
    pan_us: int = 1500
    tilt_us: int = 1500
    camera_connected: bool = False
    esp32_connected: bool = False
    stm32_connected: bool = False
    latency_ms: float | None = None
    dropped_packets: int = 0


class RuntimeStore:
    """Single source of truth for dashboard-visible control state."""

    def __init__(self) -> None:
        self._status = RuntimeStatus()
        self._lock = asyncio.Lock()

    async def snapshot(self) -> dict[str, object]:
        async with self._lock:
            return asdict(self._status)

    async def arm(self) -> dict[str, object]:
        async with self._lock:
            self._status.armed = True
            self._status.mode = RuntimeMode.AUTO
            self._status.tracking_state = TrackingState.SEARCHING
            return asdict(self._status)

    async def disarm(self) -> dict[str, object]:
        async with self._lock:
            self._status.armed = False
            self._status.mode = RuntimeMode.DISARMED
            self._status.tracking_state = TrackingState.IDLE
            self._status.error_x = 0
            self._status.error_y = 0
            return asdict(self._status)

    async def set_mode(self, mode: RuntimeMode) -> dict[str, object]:
        async with self._lock:
            self._status.mode = mode
            if mode == RuntimeMode.DISARMED:
                self._status.armed = False
                self._status.tracking_state = TrackingState.IDLE
            elif self._status.armed:
                self._status.tracking_state = TrackingState.SEARCHING
            return asdict(self._status)

    async def center(self) -> dict[str, object]:
        async with self._lock:
            self._status.pan_us = 1500
            self._status.tilt_us = 1500
            return asdict(self._status)


runtime_store = RuntimeStore()
