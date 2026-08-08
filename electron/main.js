import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// Suppress Chromium GPU disk cache warnings on Windows
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-gpu-program-cache');
app.commandLine.appendSwitch('log-level', '3');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let backendProcess = null;

function startBackendServer() {
  const serverPath = path.join(__dirname, '..', 'server', 'index.js');
  console.log('[ELECTRON] Spawning internal PTY server:', serverPath);
  backendProcess = spawn(process.execPath, [serverPath], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    stdio: 'inherit',
  });

  backendProcess.on('error', (err) => {
    console.error('[ELECTRON] Failed to start backend server:', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 940,
    height: 1000,
    minWidth: 800,
    minHeight: 850,
    title: 'AeroCDU Flight Terminal',
    backgroundColor: '#060709',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
  });

  // Open external links in default system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Log console messages and errors from renderer process
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[RENDERER CONSOLE ${level}] ${message} (${sourceId}:${line})`);
  });
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`[RENDERER FAIL LOAD] ${errorCode}: ${errorDescription}`);
  });

  const appUrl = 'http://localhost:3001';

  const tryLoad = (attempts = 0) => {
    fetch(`${appUrl}/api/health`)
      .then((res) => res.json())
      .then(() => {
        console.log('[ELECTRON] Server ready, loading:', appUrl);
        mainWindow.loadURL(appUrl);
      })
      .catch(() => {
        if (attempts < 20) {
          setTimeout(() => tryLoad(attempts + 1), 300);
        } else {
          console.warn('[ELECTRON] Server timeout, fallback loading:', appUrl);
          mainWindow.loadURL(appUrl);
        }
      });
  };

  tryLoad();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackendServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch (e) {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
