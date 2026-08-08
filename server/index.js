import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

let pty = null;
try {
  pty = await import('node-pty');
} catch (e) {
  console.warn('[SERVER] Warning: node-pty not natively compiled for this environment.');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRootDir = path.resolve(__dirname, '..');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: http });

app.use(express.json());

// Persistent File Logging to logs/aero-cdu.log (Safe with try/catch against Windows file lock EBUSY)
const logsDir = path.join(projectRootDir, 'logs');
if (!fs.existsSync(logsDir)) {
  try { fs.mkdirSync(logsDir, { recursive: true }); } catch (e) {}
}
const logFilePath = path.join(logsDir, 'aero-cdu.log');

const logToFile = (msg) => {
  const time = new Date().toISOString();
  const logLine = `[${time}] ${msg}\n`;
  try {
    fs.appendFileSync(logFilePath, logLine);
  } catch (e) {
    // Ignore Windows EBUSY file lock errors gracefully
  }
  console.log(msg);
};

logToFile('[SERVER] AeroCDU Server process starting...');

const CONFIG_FILE = path.join(__dirname, 'bindings-config.json');
const PROFILES_DIR = path.join(__dirname, 'profiles');

if (!fs.existsSync(PROFILES_DIR)) {
  try { fs.mkdirSync(PROFILES_DIR, { recursive: true }); } catch (e) {}
}

// Serve static frontend dist files
const distPath = path.join(projectRootDir, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  logToFile(`[SERVER] Serving static frontend dist files from ${distPath}`);
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ptyAvailable: !!pty, ptyType: 'winpty' });
});

// Piper TTS Managed Backend Process
import { spawn } from 'child_process';
let piperProcess = null;

const startPiperServer = () => {
  const scriptPath = path.join(__dirname, 'piper_tts_server.py');
  if (fs.existsSync(scriptPath)) {
    logToFile(`[PIPER] Spawning Piper TTS Python server script: ${scriptPath}`);
    try {
      piperProcess = spawn('python', [scriptPath], { cwd: __dirname });
      
      piperProcess.stdout.on('data', (data) => {
        logToFile(`[PIPER STDOUT] ${data.toString().trim()}`);
      });
      
      piperProcess.stderr.on('data', (data) => {
        logToFile(`[PIPER STDERR] ${data.toString().trim()}`);
      });

      piperProcess.on('exit', (code) => {
        logToFile(`[PIPER] Piper Python process exited with code ${code}`);
      });
    } catch (e) {
      logToFile(`[PIPER] Error spawning Piper server: ${e.message}`);
    }
  }
};

startPiperServer();

// Piper TTS API Proxy Endpoints
app.get('/api/tts/voices', async (req, res) => {
  const voicesDir = path.join(__dirname, 'voices');
  let available = [];
  if (fs.existsSync(voicesDir)) {
    try {
      available = fs.readdirSync(voicesDir)
        .filter(f => f.endsWith('.onnx') && !f.endsWith('.onnx.json'))
        .map(f => f.replace('.onnx', ''));
    } catch (e) {}
  }
  res.json({ voices: available });
});

app.get('/api/tts/generate', async (req, res) => {
  const { text, voice } = req.query;
  if (!text) return res.status(400).json({ error: 'Text query parameter is required' });
  
  const piperUrl = `http://127.0.0.1:5005/synthesize?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice || '')}`;
  try {
    const fetchRes = await fetch(piperUrl);
    if (!fetchRes.ok) {
      const errText = await fetchRes.text();
      return res.status(fetchRes.status).json({ error: errText || 'Piper synthesis error' });
    }
    const audioBuffer = Buffer.from(await fetchRes.arrayBuffer());
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    return res.send(audioBuffer);
  } catch (e) {
    logToFile(`[PIPER API ERROR] Failed proxying request to Piper server: ${e.message}`);
    return res.status(502).json({ error: 'Piper TTS server unavailable' });
  }
});


app.get('/api/config', (req, res) => {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      return res.json(JSON.parse(data));
    } catch (e) {
      logToFile(`[SERVER] Error reading config file: ${e.message}`);
    }
  }
  res.json({
    bindings: {},
    activeShell: 'powershell.exe',
    uiTheme: 'REALISTIC',
    audio: {
      cabinVolume: 25,
      atcVolume: 35,
      atcFrequency: 2,
      ttsProvider: 'PIPER'
    },
    uiScale: 1.0
  });
});

app.post('/api/config', (req, res) => {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(req.body, null, 2), 'utf8');
    logToFile('[SERVER] Key bindings config saved successfully.');
    res.json({ success: true });
  } catch (e) {
    logToFile(`[SERVER] Error saving config file: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
});

// Upgrade HTTP connection to WebSocket for PTY terminal session
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  if (pathname === '/pty' || pathname === '/terminal') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws, req) => {
  logToFile('[PTY] Client connected to terminal WebSocket');

  const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
  const shell = urlParams.get('shell') || (process.platform === 'win32' ? 'powershell.exe' : 'bash');
  const cols = parseInt(urlParams.get('cols'), 10) || 80;
  const rows = parseInt(urlParams.get('rows'), 10) || 24;

  // Always set terminal working directory to project root directory
  const targetCwd = projectRootDir;

  if (pty && pty.spawn) {
    logToFile(`[PTY] Spawning winpty node-pty process for: ${shell} in ${targetCwd}`);
    try {
      const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: cols,
        rows: rows,
        cwd: targetCwd,
        env: process.env,
        useConpty: false
      });

      ptyProcess.onData((data) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: 'output', data }));
        }
      });

      ptyProcess.onExit(({ exitCode, signal }) => {
        logToFile(`[PTY] Process exited with code ${exitCode}, signal ${signal}`);
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: 'exit', exitCode }));
          ws.close();
        }
      });

      ws.on('message', (message) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed.type === 'input') {
            ptyProcess.write(parsed.data);
          } else if (parsed.type === 'resize') {
            ptyProcess.resize(parsed.cols || 80, parsed.rows || 24);
          }
        } catch (e) {
          logToFile(`[PTY] Invalid WS message: ${e.message}`);
        }
      });

      ws.on('close', () => {
        logToFile('[PTY] WebSocket closed, killing PTY session');
        try {
          ptyProcess.kill();
        } catch (e) {}
      });

    } catch (err) {
      logToFile(`[PTY] Error spawning node-pty process: ${err.message}`);
      ws.send(JSON.stringify({ type: 'output', data: `Failed to spawn PTY shell: ${err.message}\r\n` }));
    }
  } else {
    logToFile('[PTY] node-pty unavailable, fallback notification sent');
    ws.send(JSON.stringify({ type: 'output', data: `[AeroCDU] PTY backend unavailable on this host.\r\n` }));
  }
});

const PORT = process.env.PORT || 3001;
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logToFile(`[SERVER] Port ${PORT} already in use. Server process reusing existing backend instance.`);
  } else {
    logToFile(`[SERVER ERROR] ${err.message}`);
  }
});
server.listen(PORT, () => {
  logToFile(`[SERVER] AeroCDU Terminal PTY Backend running on http://localhost:${PORT}`);
});
