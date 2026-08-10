# Graph Report - quick-einstein  (2026-08-10)

## Corpus Check
- 33 files · ~23,533 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 220 nodes · 346 edges · 18 communities (13 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8c03d991`
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
- vite.config.js
- graphify.md
- graphify.md
- PiperHandler
- download.ps1

## God Nodes (most connected - your core abstractions)
1. `SoundEngine` - 48 edges
2. `TerrainFlightMap()` - 10 edges
3. `useFlightSimulator()` - 10 edges
4. `getGreatCirclePoint()` - 9 edges
5. `PTYClient` - 9 edges
6. `scripts` - 8 edges
7. `App()` - 8 edges
8. `Flight Simulation Logic` - 7 edges
9. `PiperHandler` - 5 edges
10. `getInitialBearing()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `useFlightSimulator()`  [EXTRACTED]
  src/App.jsx → src/utils/useFlightSimulator.js
- `CDUScreen()` --calls--> `eventToAnsi()`  [EXTRACTED]
  src/components/CDUScreen.jsx → src/utils/keyboardHelper.js
- `lineFeature()` --calls--> `splitAntimeridianLine()`  [EXTRACTED]
  src/components/TerrainFlightMap.jsx → src/utils/geo.js
- `TerrainFlightMap()` --calls--> `getGreatCirclePoint()`  [EXTRACTED]
  src/components/TerrainFlightMap.jsx → src/utils/geo.js
- `TerrainFlightMap()` --calls--> `getGreatCirclePoints()`  [EXTRACTED]
  src/components/TerrainFlightMap.jsx → src/utils/geo.js

## Import Cycles
- None detected.

## Communities (18 total, 5 thin omitted)

### Community 1 - "dependencies"
Cohesion: 0.10
Nodes (14): App(), DEFAULT_AUDIO_SETTINGS, normalizeAudioSettings(), normalizeRange(), normalizeUiScale(), SUPPORTED_SHELLS, AnalogSixPack(), FlightDashboard() (+6 more)

### Community 2 - "SoundEngine"
Cohesion: 0.16
Nodes (23): emptyFeatureCollection(), getPassengerWindowZoom(), lineFeature(), pointFeature(), SATELLITE_TILES, TerrainFlightMap(), AIRPORT_COORDINATES, clamp() (+15 more)

### Community 3 - "package.json"
Cohesion: 0.09
Nodes (23): cors, express, lucide-react, maplibre-gl, node-pty, dependencies, cors, express (+15 more)

### Community 4 - "devDependencies"
Cohesion: 0.10
Nodes (18): CDUFrame(), CDUKeypad(), CDUScreen(), eventToAnsi(), AIRCRAFT_TYPES, ALIEN_PHRASES, ALTITUDES, ATIS_LETTERS (+10 more)

### Community 5 - "index.js"
Cohesion: 0.14
Nodes (13): main, name, private, scripts, app, build, dev, dev:all (+5 more)

### Community 6 - "soundEngine.js"
Cohesion: 0.15
Nodes (13): app, CONFIG_FILE, __dirname, distPath, __filename, logFilePath, logsDir, logToFile() (+5 more)

### Community 7 - "CDUFrame.jsx"
Cohesion: 0.15
Nodes (13): concurrently, electron, devDependencies, concurrently, electron, @types/react, @types/react-dom, vite (+5 more)

### Community 8 - "main.js"
Cohesion: 0.32
Nodes (5): BaseHTTPRequestHandler, get_voice(), PiperHandler, Piper TTS HTTP Server for Quick-Einstein ATC Chatter Loads selected Piper models, run_server()

### Community 9 - "vite.config.js"
Cohesion: 0.25
Nodes (7): Automatic flight state machine, Change checklist for future agents, Flight Simulation Logic, Overrides and route behavior, Random automated events, Runtime and time, Telemetry and display contract

## Knowledge Gaps
- **69 isolated node(s):** `__filename`, `__dirname`, `name`, `private`, `version` (+64 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SoundEngine` connect `App.jsx` to `dependencies`, `SoundEngine`, `devDependencies`?**
  _High betweenness centrality (0.177) - this node is a cross-community bridge._
- **Why does `dependencies` connect `package.json` to `index.js`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `__filename`, `__dirname`, `name` to the rest of the system?**
  _69 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12626262626262627 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10098522167487685 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10276679841897234 - nodes in this community are weakly interconnected._