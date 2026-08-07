import React from 'react';
import { Terminal, Volume2, VolumeX, Edit3, Folder, RefreshCw, Cpu } from 'lucide-react';

export function TopBar({
  ptyConnected,
  activeShell,
  onShellChange,
  programMode,
  onToggleProgramMode,
  soundMuted,
  onToggleSound,
  onOpenProfiles,
  onReconnect
}) {
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
