# Graph Report - quick-einstein  (2026-08-07)

## Corpus Check
- 17 files · ~7,279 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 126 nodes · 156 edges · 12 communities (8 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1c684402`
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

## God Nodes (most connected - your core abstractions)
1. `SoundEngine` - 23 edges
2. `PTYClient` - 9 edges
3. `scripts` - 8 edges
4. `App()` - 5 edges
5. `CDUScreen()` - 3 edges
6. `TopBar()` - 3 edges
7. `eventToAnsi()` - 3 edges
8. `@xterm/addon-fit` - 2 edges
9. `@xterm/xterm` - 2 edges
10. `cors` - 2 edges

## Surprising Connections (you probably didn't know these)
- `CDUScreen()` --calls--> `eventToAnsi()`  [EXTRACTED]
  src/components/CDUScreen.jsx → src/utils/keyboardHelper.js

## Import Cycles
- None detected.

## Communities (12 total, 4 thin omitted)

### Community 0 - "App.jsx"
Cohesion: 0.14
Nodes (6): App(), KeyProgrammerModal(), PRESET_PROFILES, ProfileModal(), TopBar(), PTYClient

### Community 1 - "dependencies"
Cohesion: 0.11
Nodes (19): cors, express, lucide-react, node-pty, dependencies, cors, express, lucide-react (+11 more)

### Community 3 - "package.json"
Cohesion: 0.14
Nodes (13): main, name, private, scripts, app, build, dev, dev:all (+5 more)

### Community 4 - "devDependencies"
Cohesion: 0.15
Nodes (13): concurrently, electron, devDependencies, concurrently, electron, @types/react, @types/react-dom, vite (+5 more)

### Community 5 - "index.js"
Cohesion: 0.15
Nodes (11): app, CONFIG_FILE, __dirname, distPath, __filename, logFilePath, logsDir, PROFILES_DIR (+3 more)

### Community 6 - "soundEngine.js"
Cohesion: 0.20
Nodes (9): ALIEN_PHRASES, ALTITUDES, CALLSIGNS, EMERGENCY_PHRASES, FACILITIES, FLIGHT_LEVELS, FREQUENCIES, HEADINGS (+1 more)

### Community 7 - "CDUFrame.jsx"
Cohesion: 0.39
Nodes (4): CDUFrame(), CDUKeypad(), CDUScreen(), eventToAnsi()

## Knowledge Gaps
- **52 isolated node(s):** `__filename`, `__dirname`, `name`, `private`, `version` (+47 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SoundEngine` connect `SoundEngine` to `App.jsx`, `soundEngine.js`, `CDUFrame.jsx`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **What connects `__filename`, `__dirname`, `name` to the rest of the system?**
  _52 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14210526315789473 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._