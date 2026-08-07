import React from 'react';
import { Terminal, Volume2, VolumeX, Edit3, Folder, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export function TopBar({
  ptyConnected,
  activeShell,
  onShellChange,
  programMode,
  onToggleProgramMode,
  soundMuted,
  onToggleSound,
  onOpenProfiles,
  onReconnect,
  uiScale = 1.0,
  onZoomInUI,
  onZoomOutUI,
  onResetUI
}) {
  const scalePercent = Math.round(uiScale * 100);

  return (
    <div className="top-bar">
      <div className="brand-section">
        <Terminal className="brand-icon" size={20} />
        <div className="brand-title">
          AERO-CDU <span className="brand-badge">PTY TERMINAL</span>
        </div>
      </div>

      <div className="controls-section">
        <button
          className={`icon-btn ${programMode ? 'active' : ''}`}
          onClick={onToggleProgramMode}
          title="Toggle Key Programming Mode (Click any key to edit binding)"
        >
          <Edit3 size={14} />
          {programMode ? 'PROGRAMMING ON' : 'PROG MODE'}
        </button>

        <button
          className="icon-btn"
          onClick={onOpenProfiles}
          title="Macro Preset Profiles"
        >
          <Folder size={14} />
          PROFILES
        </button>

        <select
          className="icon-btn"
          value={activeShell}
          onChange={(e) => onShellChange(e.target.value)}
          title="Select Local PTY Shell"
          style={{ cursor: 'pointer', outline: 'none' }}
        >
          <option value="powershell.exe">PowerShell</option>
          <option value="cmd.exe">CMD</option>
          <option value="bash">WSL Bash</option>
        </select>

        {/* UI Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#1c2028', borderRadius: 6, padding: 2, border: '1px solid #363d4a' }}>
          <button
            className="icon-btn"
            style={{ padding: '4px 8px', border: 'none', background: 'transparent' }}
            onClick={onZoomOutUI}
            title="Zoom Out Entire CDU UI"
          >
            <ZoomOut size={14} />
          </button>
          <span
            onClick={onResetUI}
            title="Reset UI Zoom to 100%"
            style={{ fontSize: 11, fontWeight: 'bold', color: 'var(--crt-cyan)', cursor: 'pointer', padding: '0 4px', fontFamily: 'Share Tech Mono, monospace' }}
          >
            {scalePercent}%
          </span>
          <button
            className="icon-btn"
            style={{ padding: '4px 8px', border: 'none', background: 'transparent' }}
            onClick={onZoomInUI}
            title="Zoom In Entire CDU UI"
          >
            <ZoomIn size={14} />
          </button>
        </div>

        <button
          className="icon-btn"
          onClick={onToggleSound}
          title={soundMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {soundMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>

        <button
          className="icon-btn"
          onClick={onReconnect}
          title="Reconnect PTY Terminal Session"
        >
          <RefreshCw size={14} />
        </button>

        <div className={`status-dot ${ptyConnected ? 'connected' : 'error'}`} title={ptyConnected ? 'PTY Connected' : 'PTY Disconnected'} />
      </div>
    </div>
  );
}
