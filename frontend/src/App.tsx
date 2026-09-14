import { useEffect, useState } from "react";

type Status = {
  armed: boolean;
  mode: string;
  tracking_state: string;
  target_id: number | null;
  confidence: number;
  error_x: number;
  error_y: number;
  pan_us: number;
  tilt_us: number;
  camera_connected: boolean;
  esp32_connected: boolean;
  stm32_connected: boolean;
  latency_ms: number | null;
  dropped_packets: number;
};

const initialStatus: Status = {
  armed: false,
  mode: "DISARMED",
  tracking_state: "IDLE",
  target_id: null,
  confidence: 0,
  error_x: 0,
  error_y: 0,
  pan_us: 1500,
  tilt_us: 1500,
  camera_connected: false,
  esp32_connected: false,
  stm32_connected: false,
  latency_ms: null,
  dropped_packets: 0,
};

async function post(path: string) {
  await fetch(path, { method: "POST" });
}

export default function App() {
  const [status, setStatus] = useState<Status>(initialStatus);

  useEffect(() => {
    const socket = new WebSocket(`ws://${window.location.host}/ws/telemetry`);
    socket.onmessage = (event) => setStatus(JSON.parse(event.data));
    return () => socket.close();
  }, []);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">LOCAL SECURITY SYSTEM</p>
          <h1>Person Tracking</h1>
        </div>
        <div className={`state state-${status.tracking_state.toLowerCase()}`}>
          {status.tracking_state}
        </div>
      </header>

      <section className="workspace">
        <div className="video-panel">
          <div className="panel-heading">
            <span>Live camera</span>
            <span className="muted">Video worker pending</span>
          </div>
          <div className="video-placeholder">
            <span>Camera stream will appear here</span>
          </div>
        </div>

        <aside className="side-panel">
          <section className="panel-section">
            <h2>Control</h2>
            <div className="button-row">
              <button onClick={() => post("/api/system/arm")}>Arm</button>
              <button className="secondary" onClick={() => post("/api/system/disarm")}>
                Disarm
              </button>
            </div>
            <button className="wide" onClick={() => post("/api/control/center")}>
              Center camera
            </button>
          </section>

          <section className="panel-section metrics">
            <h2>Telemetry</h2>
            <Metric label="Mode" value={status.mode} />
            <Metric label="Target" value={status.target_id ?? "None"} />
            <Metric label="Confidence" value={`${Math.round(status.confidence * 100)}%`} />
            <Metric label="Image error" value={`${status.error_x}, ${status.error_y}`} />
            <Metric label="Pan / tilt" value={`${status.pan_us} / ${status.tilt_us} µs`} />
            <Metric label="Latency" value={status.latency_ms ? `${status.latency_ms} ms` : "--"} />
          </section>

          <section className="panel-section connections">
            <h2>Connections</h2>
            <Connection label="Camera" connected={status.camera_connected} />
            <Connection label="ESP32" connected={status.esp32_connected} />
            <Connection label="STM32" connected={status.stm32_connected} />
          </section>
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function Connection({ label, connected }: { label: string; connected: boolean }) {
  return <div className="connection"><span className={`dot ${connected ? "online" : "offline"}`} />{label}<span className="muted">{connected ? "online" : "offline"}</span></div>;
}
