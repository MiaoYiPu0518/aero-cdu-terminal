// WebSocket client wrapper for node-pty terminal backend

export const TERMINAL_COLS = 140;
export const TERMINAL_ROWS = 40;

export class PTYClient {
  constructor(options = {}) {
    this.options = options;
    this.ws = null;
    this.connected = false;
    this.onDataHandler = null;
    this.onStatusHandler = null;
  }

  connect(shell = 'powershell.exe', cols = TERMINAL_COLS, rows = TERMINAL_ROWS) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const host = isLocalHost ? `${window.location.hostname}:3001` : window.location.host;
    const url = `${protocol}//${host}/terminal?shell=${encodeURIComponent(shell)}&cols=${cols}&rows=${rows}`;

    console.log('[PTY Client] Connecting to', url);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.connected = true;
        if (this.onStatusHandler) this.onStatusHandler('CONNECTED');
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'output' && this.onDataHandler) {
            this.onDataHandler(msg.data);
          }
        } catch (e) {
          if (this.onDataHandler) this.onDataHandler(event.data);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[PTY Client] WebSocket error:', err);
        if (this.onStatusHandler) this.onStatusHandler('ERROR');
      };

      this.ws.onclose = () => {
        this.connected = false;
        if (this.onStatusHandler) this.onStatusHandler('DISCONNECTED');
      };
    } catch (e) {
      console.error('[PTY Client] Failed to create WebSocket:', e);
      if (this.onStatusHandler) this.onStatusHandler('DISCONNECTED');
    }
  }

  sendInput(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'input', data }));
    } else {
      console.warn('[PTY Client] WebSocket not open, cannot send input');
    }
  }

  resize(cols, rows) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'resize', cols, rows }));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  onData(fn) {
    this.onDataHandler = fn;
    return () => {
      if (this.onDataHandler === fn) {
        this.onDataHandler = null;
      }
    };
  }

  onStatus(fn) {
    this.onStatusHandler = fn;
  }
}
