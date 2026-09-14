# Firmware Integration

The firmware will be added after the backend and dashboard contract is stable.

- `esp32/`: WiFi/TCP to UART bridge with packet validation
- `stm32/`: STM32CubeIDE project with FreeRTOS, PID, safety, and TIM3 PWM

The backend will communicate through a device-client interface so mock devices
can be used in tests before physical boards are connected.
