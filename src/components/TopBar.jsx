import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Volume2, VolumeX, Edit3, Folder, RefreshCw, ZoomIn, ZoomOut, Sliders, ChevronDown } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

export function TopBar({
  ptyConnected,
  activeShell,
  onShellChange,
  programMode,
  onToggleProgramMode,
  soundMuted,
  onToggleSound,
  cabinNoiseActive,
  onToggleCabinNoise,
  atcChatterActive,
  onToggleATCChatter,
  onOpenProfiles,
  onReconnect,
  uiScale = 1.0,
  onZoomInUI,
  onZoomOutUI,
  onResetUI
}) {
  const [activeMenu, setActiveMenu] = useState(null); // 'AUDIO' | 'VIEW' | null
  const [cabinVolume, setCabinVolume] = useState(25);
  const [atcVolume, setAtcVolume] = useState(35);
  const [atcFrequency, setAtcFrequency] = useState(2); // 1: LOW, 2: MED, 3: HIGH, 4: RAPID

  const menuRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCabinVolChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setCabinVolume(val);
    soundEngine.setCabinVolume(val / 100);
  };

  const handleATCVolChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setAtcVolume(val);
    soundEngine.setATCVolume(val / 100);
  };

  const handleATCFreqChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setAtcFrequency(val);
    soundEngine.setATCChatterFrequency(val);
  };

  const scalePercent = Math.round(uiScale * 100);

  return (
    <div className="top-bar" ref={menuRef}>
      <div className="brand-section">
        <Terminal className="brand-icon" size={18} />
        <div className="brand-title">
          AERO-CDU <span className="brand-badge">PTY</span>
        </div>
      </div>

      <div className="controls-section">
        {/* Key Programmer Toggle */}
        <button
          className={`icon-btn ${programMode ? 'active' : ''}`}
          onClick={onToggleProgramMode}
          title="Toggle Key Programming Mode"
        >
          <Edit3 size={13} />
          {programMode ? 'PROG ON' : 'PROG'}
        </button>

        {/* Profiles Manager */}
        <button
          className="icon-btn"
          onClick={onOpenProfiles}
          title="Macro Preset Profiles"
        >
          <Folder size={13} />
          PROFILES
        </button>

        {/* Shell Selector Dropdown */}
        <div className="topbar-dropdown-wrap">
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
        </div>

        {/* Audio Popover Menu */}
        <div style={{ position: 'relative' }}>
          <button
            className={`icon-btn ${(cabinNoiseActive || atcChatterActive) ? 'active' : ''}`}
            onClick={() => setActiveMenu(activeMenu === 'AUDIO' ? null : 'AUDIO')}
            title="Audio & Sound Level Settings"
          >
            {soundMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            AUDIO
            <ChevronDown size={11} />
          </button>

          {activeMenu === 'AUDIO' && (
            <div className="topbar-popover">
              <div className="popover-header">
                <Sliders size={13} /> AUDIO SETTINGS
              </div>

              <div className="popover-row">
                <span className="popover-label">MASTER MUTE</span>
                <button
                  className={`icon-btn ${soundMuted ? 'active' : ''}`}
                  onClick={onToggleSound}
                  style={{ padding: '3px 8px' }}
                >
                  {soundMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  {soundMuted ? 'MUTED' : 'ON'}
                </button>
              </div>

              <div className="popover-divider" />

              <div className="popover-row">
                <span className="popover-label">CABIN HUM</span>
                <button
                  className={`icon-btn ${cabinNoiseActive ? 'active' : ''}`}
                  onClick={onToggleCabinNoise}
                  style={{ padding: '3px 8px' }}
                >
                  {cabinNoiseActive ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="popover-slider-row">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={cabinVolume}
                  onChange={handleCabinVolChange}
                  className="popover-range"
                />
                <span className="popover-val">{cabinVolume}%</span>
              </div>

              <div className="popover-divider" />

              <div className="popover-row">
                <span className="popover-label">ATC CHATTER</span>
                <button
                  className={`icon-btn ${atcChatterActive ? 'active' : ''}`}
                  onClick={onToggleATCChatter}
                  style={{ padding: '3px 8px' }}
                >
                  {atcChatterActive ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="popover-slider-row">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={atcVolume}
                  onChange={handleATCVolChange}
                  className="popover-range"
                />
                <span className="popover-val">{atcVolume}%</span>
              </div>

              <div className="popover-row" style={{ marginTop: 4 }}>
                <span className="popover-label">CHATTER FREQUENCY</span>
                <span className="popover-val">{['', 'LOW', 'MED', 'HIGH', 'RAPID'][atcFrequency]}</span>
              </div>
              <div className="popover-slider-row">
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={atcFrequency}
                  onChange={handleATCFreqChange}
                  className="popover-range"
                />
              </div>
            </div>
          )}
        </div>

        {/* View / Zoom Popover Menu */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setActiveMenu(activeMenu === 'VIEW' ? null : 'VIEW')}
            title="UI Scale & View Options"
          >
            <ZoomIn size={13} />
            VIEW ({scalePercent}%)
            <ChevronDown size={11} />
          </button>

          {activeMenu === 'VIEW' && (
            <div className="topbar-popover">
              <div className="popover-header">
                <ZoomIn size={13} /> UI SCALE
              </div>
              <div className="popover-row" style={{ justifyContent: 'space-between', gap: 6 }}>
                <button className="icon-btn" onClick={onZoomOutUI}><ZoomOut size={12} /> OUT</button>
                <span className="zoom-badge" onClick={onResetUI} title="Reset to 100%">{scalePercent}%</span>
                <button className="icon-btn" onClick={onZoomInUI}><ZoomIn size={12} /> IN</button>
              </div>
            </div>
          )}
        </div>

        {/* Reconnect Session */}
        <button
          className="icon-btn"
          onClick={onReconnect}
          title="Reconnect PTY Session"
        >
          <RefreshCw size={13} />
        </button>

        {/* PTY Connection Status Indicator */}
        <div className={`status-dot ${ptyConnected ? 'connected' : 'error'}`} title={ptyConnected ? 'PTY Connected' : 'PTY Disconnected'} />
      </div>
    </div>
  );
}
