# Graph Report - quick-einstein  (2026-08-08)

## Corpus Check
- 31 files · ~23,150 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 195 nodes · 295 edges · 18 communities (14 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `86dfc627`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.jsx
- dependencies
- SoundEngine
- package.json
- devDependencies
- index.js
- soundEngine.js
- CDUFrame.jsx
- main.js
- graphify.md
- graphify.md
- PiperHandler
- FlightDashboard.jsx
- Flight Simulation Logic

## God Nodes (most connected - your core abstractions)
1. `SoundEngine` - 48 edges
2. `PTYClient` - 9 edges
3. `scripts` - 8 edges
4. `App()` - 8 edges
5. `Flight Simulation Logic` - 7 edges
6. `PiperHandler` - 5 edges
7. `useFlightSimulator()` - 5 edges
8. `normalizeAudioSettings()` - 3 edges
9. `CDUScreen()` - 3 edges
10. `eventToAnsi()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `useFlightSimulator()`  [EXTRACTED]
  src/App.jsx → src/utils/useFlightSimulator.js
- `CDUScreen()` --calls--> `eventToAnsi()`  [EXTRACTED]
  src/components/CDUScreen.jsx → src/utils/keyboardHelper.js

## Import Cycles
- None detected.

## Communities (18 total, 4 thin omitted)

### Community 0 - "App.jsx"
Cohesion: 0.11
Nodes (15): App(), DEFAULT_AUDIO_SETTINGS, normalizeAudioSettings(), normalizeRange(), normalizeUiScale(), SUPPORTED_SHELLS, KeyProgrammerModal(), PRESET_PROFILES (+7 more)

### Community 1 - "dependencies"
Cohesion: 0.10
Nodes (21): cors, express, lucide-react, node-pty, dependencies, cors, express, lucide-react (+13 more)

### Community 3 - "package.json"
Cohesion: 0.14
Nodes (13): main, name, private, scripts, app, build, dev, dev:all (+5 more)

### Community 4 - "devDependencies"
Cohesion: 0.15
Nodes (13): concurrently, electron, devDependencies, concurrently, electron, @types/react, @types/react-dom, vite (+5 more)

### Community 5 - "index.js"
Cohesion: 0.15
Nodes (13): app, CONFIG_FILE, __dirname, distPath, __filename, logFilePath, logsDir, logToFile() (+5 more)

### Community 6 - "soundEngine.js"
Cohesion: 0.13
Nodes (14): AIRCRAFT_TYPES, ALIEN_PHRASES, ALTITUDES, ATIS_LETTERS, CALLSIGNS, EMERGENCY_PHRASES, FACILITIES, FLIGHT_LEVELS (+6 more)

### Community 7 - "CDUFrame.jsx"
Cohesion: 0.39
Nodes (4): CDUFrame(), CDUKeypad(), CDUScreen(), eventToAnsi()

### Community 12 - "PiperHandler"
Cohesion: 0.32
Nodes (5): BaseHTTPRequestHandler, get_voice(), PiperHandler, Piper TTS HTTP Server for Quick-Einstein ATC Chatter Loads selected Piper models, run_server()

### Community 15 - "FlightDashboard.jsx"
Cohesion: 0.47
Nodes (3): AnalogRadarScope(), AnalogSixPack(), FlightDashboard()

### Community 17 - "Flight Simulation Logic"
Cohesion: 0.25
Nodes (7): Automatic flight state machine, Change checklist for future agents, Flight Simulation Logic, Overrides and route behavior, Random automated events, Runtime and time, Telemetry and display contract

## Knowledge Gaps
- **66 isolated node(s):** `__filename`, `__dirname`, `name`, `private`, `version` (+61 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SoundEngine` connect `SoundEngine` to `App.jsx`, `soundEngine.js`, `CDUFrame.jsx`?**
  _High betweenness centrality (0.176) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `__filename`, `__dirname`, `name` to the rest of the system?**
  _66 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10591133004926108 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `SoundEngine` be split into smaller, more focused modules?**
  _Cohesion score 0.12626262626262627 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._