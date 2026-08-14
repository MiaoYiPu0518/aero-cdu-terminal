# AeroCDU - Avionics Control Display Unit & Terminal Deck

**AeroCDU** is a cyber-avionics terminal deck and interactive flight simulator workstation inspired by modern airliner Flight Management Computers (CDU/FMC) and aerospace telemetry displays.

---

## ✈ Features

- **Avionics CDU Interface**:
  - Full-fidelity physical CDU layout with multi-line scratchpad, Line Select Keys (LSKs), alphanumeric keypad, and mode annunciators (`EXEC`, `MSG`, `DSPY`, `FAIL`, `OFST`).
  - Customizable soft-key bindings supporting multi-line shell scripts, custom commands, and environment profile switching.
  - Authentic CRT screen rendering with phosphor glow, subtle scanlines, and configurable color palettes (Cyan, Amber, Green, Monochrome).

- **Flight Simulation Engine**:
  - Real-time aerodynamic state machine managing end-to-end flight cycles: `TAXI` → `TAKEOFF` → `CLIMB` → `CRUISE` → `DESCENT` → `APPROACH` → `TOUCHDOWN`.
  - Dynamic automated ATC events, weather deviations, turbulence simulation, and TCAS avoidance maneuvers.
  - Dual control modes: Automated flight director and Manual pilot overrides (Flaps, Landing Gear, Speedbrake, Throttle, and Panic/Emergency descent modes).

- **Flight Instruments & Navigation**:
  - **Analog Six-Pack & EICAS Panel**: Airspeed indicator, Artificial Horizon, Altimeter, Turn Coordinator, Directional Gyro / Heading Indicator, and Vertical Speed Indicator (VSI) alongside dual-engine N1/EGT thrust gauges.
  - **Terrain Flight Map**: WebGL-accelerated satellite navigation map (MapLibre GL) featuring great-circle route plotting, antimeridian dateline wrapping, live ownship ground track rotation, and switchable camera modes (`TRACK`, `ROUTE`, `WINDOW`).

- **Cockpit Audio & ATC Chatter**:
  - Built-in audio synthesizer for authentic cockpit alerts: Master Caution, Altitude Chime, TCAS Warning Klaxon, Overspeed Horn, Gear Actuation, and Touchdown Chirp.
  - Neural text-to-speech integration powered by Piper TTS for real-time Air Traffic Control radio communication and altitude callouts.

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, MapLibre GL, Lucide Icons, Vanilla CSS Design System
- **Avionics Terminal**: `@xterm/xterm`, `@xterm/addon-fit`, WebSocket streaming
- **Backend & PTY**: Node.js, Express, `ws`, `node-pty`
- **Desktop Wrapper**: Electron
- **Speech Synthesis**: Piper TTS (Python / ONNX Runtime)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Python 3.10+](https://www.python.org/) (optional, required for Piper neural ATC voice chatter)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MiaoYiPu0518/aero-cdu-terminal.git
   cd aero-cdu-terminal
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. (Optional) Set up Piper TTS for ATC voice chatter:
   ```bash
   pip install piper-tts
   python server/download_voices.py
   ```

---

## 💻 Running the Application

### Development Mode (Web Browser)
Runs the PTY backend server and Vite frontend concurrently with hot-reloading:
```bash
npm run dev:all
```
Open your browser at `http://localhost:5173`.

### Desktop Application Mode (Electron)
Builds the frontend bundle and launches the standalone desktop window:
```bash
npm run app
```

---

## 📂 Project Structure

```
.
├── docs/                      # Technical documentation & flight physics specs
├── electron/                  # Electron main process entry point
├── public/                    # Static assets, SVG markers & synthesized audio
├── scratch/                   # Audio and asset generation utilities
├── server/                    # Express backend, WebSocket server & Piper TTS bridge
├── src/
│   ├── components/            # React UI components (CDU, Dashboard, Instruments, Map)
│   ├── utils/                 # Simulator state machine, sound engine & PTY client
│   ├── App.jsx                # Main cockpit layout manager
│   ├── index.css              # CRT shader & avionics styling system
│   └── main.jsx               # Application bootstrap
├── package.json
└── vite.config.js
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
