# Graph Report - quick-einstein  (2026-08-08)

## Corpus Check
- 30 files · ~20,581 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 173 nodes · 241 edges · 16 communities (12 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3333fbd4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.jsx
- dependencies
- SoundEngine
- package.json
- devDependencies
- index.js
- CDUFrame.jsx
- main.js
- graphify.md
- graphify.md
- PiperHandler
- FlightDashboard.jsx

## God Nodes (most connected - your core abstractions)
1. `SoundEngine` - 43 edges
2. `PTYClient` - 9 edges
3. `scripts` - 8 edges
4. `App()` - 6 edges
5. `PiperHandler` - 5 edges
6. `CDUScreen()` - 3 edges
7. `TopBar()` - 3 edges
8. `eventToAnsi()` - 3 edges
9. `useFlightSimulator()` - 3 edges
10. `@xterm/addon-fit` - 2 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `useFlightSimulator()`  [EXTRACTED]
  src/App.jsx → src/utils/useFlightSimulator.js
- `CDUScreen()` --calls--> `eventToAnsi()`  [EXTRACTED]
  src/components/CDUScreen.jsx → src/utils/keyboardHelper.js

## Import Cycles
- None detected.

## Communities (16 total, 4 thin omitted)

### Community 0 - "App.jsx"
Cohesion: 0.07
Nodes (21): App(), KeyProgrammerModal(), PRESET_PROFILES, ProfileModal(), TopBar(), PTYClient, AIRCRAFT_TYPES, ALIEN_PHRASES (+13 more)

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

### Community 7 - "CDUFrame.jsx"
Cohesion: 0.39
Nodes (4): CDUFrame(), CDUKeypad(), CDUScreen(), eventToAnsi()

### Community 12 - "PiperHandler"
Cohesion: 0.32
Nodes (5): BaseHTTPRequestHandler, get_voice(), PiperHandler, Piper TTS HTTP Server for Quick-Einstein ATC Chatter Loads selected Piper models, run_server()

### Community 15 - "FlightDashboard.jsx"
Cohesion: 0.47
Nodes (3): AnalogRadarScope(), AnalogSixPack(), FlightDashboard()

## Knowledge Gaps
- **58 isolated node(s):** `__filename`, `__dirname`, `name`, `private`, `version` (+53 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SoundEngine` connect `SoundEngine` to `App.jsx`, `CDUFrame.jsx`?**
  _High betweenness centrality (0.169) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `__filename`, `__dirname`, `name` to the rest of the system?**
  _58 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07207207207207207 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `SoundEngine` be split into smaller, more focused modules?**
  _Cohesion score 0.12375533428165007 - nodes in this community are weakly interconnected._