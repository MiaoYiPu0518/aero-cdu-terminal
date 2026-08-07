import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn as childSpawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File logging setup
const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}
const LOG_FILE = path.join(LOG_DIR, 'aero-cdu.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(msg);
  try {
    fs.appendFileSync(LOG_FILE, line, 'utf-8');
  } catch (e) {}
}

// Import node-pty dynamically
let ptyModule = null;
try {
  ptyModule = await import('node-pty');
  log('[SERVER] node-pty loaded successfully');
} catch (err) {
  log(`[SERVER] node-pty native module import failed: ${err.message}`);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR)) {
  log(`[SERVER] Serving static frontend dist files from ${DIST_DIR}`);
  app.use(express.static(DIST_DIR));
}

const CONFIG_FILE = path.join(__dirname, 'bindings-config.json');
const PROFILES_DIR = path.join(__dirname, 'profiles');

if (!fs.existsSync(PROFILES_DIR)) {
  fs.mkdirSync(PROFILES_DIR, { recursive: true });
}

// REST API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ptyAvailable: !!ptyModule });
});

app.get('/api/config', (req, res) => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return res.json(JSON.parse(data));
    }
  } catch (e) {
    log(`[ERROR] Reading config file: ${e.message}`);
  }
  res.json({ bindings: {}, activeShell: 'powershell.exe' });
});

app.post('/api/config', (req, res) => {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (e) {
    log(`[ERROR] Saving config file: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
});

// Profiles API
app.get('/api/profiles', (req, res) => {
  try {
    const files = fs.readdirSync(PROFILES_DIR).filter((f) => f.endsWith('.json'));
    const profiles = files.map((f) => ({
      id: f.replace('.json', ''),
      name: f.replace('.json', '').toUpperCase(),
    }));
    res.json({ profiles });
  } catch (e) {
    res.json({ profiles: [] });
  }
});

app.post('/api/profiles/:id', (req, res) => {
  try {
    const profilePath = path.join(PROFILES_DIR, `${req.params.id}.json`);
    fs.writeFileSync(profilePath, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (e) {
    log(`[ERROR] Saving profile: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/profiles/:id', (req, res) => {
  try {
    const profilePath = path.join(PROFILES_DIR, `${req.params.id}.json`);
    if (fs.existsSync(profilePath)) {
      const data = fs.readFileSync(profilePath, 'utf-8');
      return res.json(JSON.parse(data));
    }
    res.status(404).json({ error: 'Profile not found' });
  } catch (e) {
    log(`[ERROR] Reading profile: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
});

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/pty' });

// WebSocket PTY Handling
wss.on('connection', (ws, req) => {
  log('[PTY] Client connected to terminal WebSocket');

  const urlParams = new URLSearchParams(req.url.split('?')[1]);
  const requestedShell = urlParams.get('shell') || 'powershell.exe';
  const cols = parseInt(urlParams.get('cols') || '80', 10);
  const rows = parseInt(urlParams.get('rows') || '24', 10);

  const isWindows = process.platform === 'win32';
  const defaultShell = isWindows ? (requestedShell.includes('cmd') ? 'cmd.exe' : 'powershell.exe') : 'bash';

  let ptyProcess = null;

  if (ptyModule && ptyModule.spawn) {
    try {
      log(`[PTY] Spawning winpty node-pty process for: ${defaultShell}`);
      ptyProcess = ptyModule.spawn(defaultShell, [], {
        name: 'xterm-256color',
        cols: cols,
        rows: rows,
        cwd: process.cwd(),
        env: process.env,
        useConpty: false,
      });
    } catch (err1) {
      log(`[PTY] node-pty winpty spawn failed: ${err1.message}`);
      try {
        ptyProcess = ptyModule.spawn(defaultShell, [], {
          name: 'xterm-256color',
          cols: cols,
          rows: rows,
          cwd: process.cwd(),
          env: process.env,
        });
      } catch (err2) {
        log(`[PTY] node-pty conpty spawn failed: ${err2.message}`);
      }
    }
  }

  if (ptyProcess) {
    ptyProcess.onData((data) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data }));
      }
    });

    ptyProcess.onExit(({ exitCode }) => {
      log(`[PTY] PTY process exited with code: ${exitCode}`);
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'exit', exitCode }));
      }
    });
  } else {
    log(`[PTY] Using child_process spawn fallback for shell: ${defaultShell}`);
    const args = isWindows ? (defaultShell.includes('powershell') ? ['-NoLogo'] : []) : [];
    const child = childSpawn(defaultShell, args, {
      cwd: process.cwd(),
      env: process.env,
      shell: true,
    });

    child.stdout.on('data', (chunk) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data: chunk.toString() }));
      }
    });

    child.stderr.on('data', (chunk) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data: chunk.toString() }));
      }
    });

    child.on('close', (code) => {
      log(`[PTY] Shell closed with exit code: ${code}`);
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'exit', exitCode: code }));
      }
    });

    ptyProcess = {
      write: (data) => child.stdin.write(data),
      resize: () => {},
      kill: () => child.kill(),
    };
  }

  ws.on('message', (msg) => {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.type === 'input' && parsed.data) {
        ptyProcess.write(parsed.data);
      } else if (parsed.type === 'resize' && ptyProcess.resize) {
        ptyProcess.resize(parsed.cols, parsed.rows);
      }
    } catch (e) {
      if (typeof msg === 'string') {
        ptyProcess.write(msg);
      }
    }
  });

  ws.on('close', () => {
    log('[PTY] Client disconnected');
    if (ptyProcess && ptyProcess.kill) {
      try {
        ptyProcess.kill();
      } catch (e) {}
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  log(`[SERVER] AeroCDU Terminal PTY Backend running on http://localhost:${PORT}`);
});
