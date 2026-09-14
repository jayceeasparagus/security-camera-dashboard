# Initial Architecture

## Ownership

The PC is responsible for camera capture, person perception, target selection,
event storage, and high-level control decisions. The FastAPI backend exposes
those capabilities to the browser. The ESP32 transports validated commands over
WiFi and UART. The STM32 owns deterministic PID control, PWM, limits, and
communication-loss safety.

The browser is intentionally not in the motor-control loop. Closing the
dashboard must not terminate tracking or safety behavior.

## Initial implementation order

1. Prove the backend API and dashboard state contract with mock data.
2. Add the camera worker and MJPEG video stream.
3. Add person detection, target locking, and event storage.
4. Add the ESP32/STM32 device client behind a backend interface.
5. Connect image error to the STM32 PID controller.
6. Add fault injection, hardware tests, and performance measurements.
