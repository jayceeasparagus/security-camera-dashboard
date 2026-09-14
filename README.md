# Security Camera Dashboard

A local person-tracking security camera with a browser dashboard, OpenCV
perception, ESP32 networking, and STM32 real-time pan/tilt control.

## Current milestone

The repository starts with a backend/frontend contract and mock telemetry. This
lets the dashboard and API be tested before camera or motor hardware is added.

## Planned data flow

```text
USB camera -> OpenCV person tracking -> control coordinator
                                      -> ESP32 TCP/UART bridge
                                      -> STM32 FreeRTOS PID controller
                                      -> pan/tilt servos

FastAPI backend -> WebSocket telemetry -> browser dashboard
                -> REST configuration/manual controls
                -> SQLite event history
```

## Development

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/dashboard/` after starting the backend. The
dashboard is plain HTML, CSS, and JavaScript served by FastAPI; it has no Node,
React, TypeScript, or frontend build step.

The hardware integration is intentionally not part of this first scaffold.
See `docs/ARCHITECTURE.md` for component ownership and implementation order.
