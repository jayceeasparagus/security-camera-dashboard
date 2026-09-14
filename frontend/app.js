"use strict";

const statusElements = {
  systemState: document.querySelector("#system-state"),
  apiStatus: document.querySelector("#api-status"),
  mode: document.querySelector("#mode"),
  target: document.querySelector("#target"),
  confidence: document.querySelector("#confidence"),
  error: document.querySelector("#error"),
  position: document.querySelector("#position"),
  latency: document.querySelector("#latency"),
};

const initialStatus = {
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
};

function setApiStatus(text, online) {
  statusElements.apiStatus.textContent = text;
  statusElements.apiStatus.style.color = online ? "#8ee0b4" : "#72818d";
}

function updateStatus(status) {
  const state = status.tracking_state || "IDLE";
  statusElements.systemState.textContent = state;
  statusElements.systemState.className = `state state-${state.toLowerCase()}`;
  statusElements.mode.textContent = status.mode || "DISARMED";
  statusElements.target.textContent = status.target_id ?? "None";
  statusElements.confidence.textContent = `${Math.round((status.confidence || 0) * 100)}%`;
  statusElements.error.textContent = `${status.error_x || 0}, ${status.error_y || 0}`;
  statusElements.position.textContent = `${status.pan_us || 1500} / ${status.tilt_us || 1500} us`;
  statusElements.latency.textContent = status.latency_ms == null ? "--" : `${status.latency_ms} ms`;

  setConnection("camera", status.camera_connected);
  setConnection("esp32", status.esp32_connected);
  setConnection("stm32", status.stm32_connected);
}

function setConnection(name, online) {
  const dot = document.querySelector(`[data-connection="${name}"]`);
  const label = document.querySelector(`#${name}-connection`);
  dot.classList.toggle("online", Boolean(online));
  label.textContent = online ? "Online" : "Offline";
}

async function post(path, body) {
  const options = { method: "POST", headers: {} };
  if (body) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  const response = await fetch(path, options);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  updateStatus(await response.json());
}

function connectTelemetry() {
  const scheme = window.location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(`${scheme}://${window.location.host}/ws/telemetry`);
  socket.onopen = () => setApiStatus("API online", true);
  socket.onmessage = (event) => updateStatus(JSON.parse(event.data));
  socket.onclose = () => {
    setApiStatus("API offline", false);
    window.setTimeout(connectTelemetry, 2000);
  };
  socket.onerror = () => socket.close();
}

function bindControls() {
  document.querySelector("#arm-button").addEventListener("click", () => post("/api/system/arm").catch(showError));
  document.querySelector("#disarm-button").addEventListener("click", () => post("/api/system/disarm").catch(showError));
  document.querySelector("#center-button").addEventListener("click", () => post("/api/control/center").catch(showError));
  document.querySelector("#stop-button").addEventListener("click", () => post("/api/control/manual", { pan_delta_us: 0, tilt_delta_us: 0 }).catch(showError));
  document.querySelectorAll("[data-pan]").forEach((button) => {
    button.addEventListener("click", () => post("/api/control/manual", {
      pan_delta_us: Number(button.dataset.pan),
      tilt_delta_us: Number(button.dataset.tilt),
    }).catch(showError));
  });
}

function showError(error) {
  setApiStatus(`Error: ${error.message}`, false);
}

updateStatus(initialStatus);
bindControls();
connectTelemetry();
