import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Volume2, VolumeX, Edit3, Folder, RefreshCw, ZoomIn, ZoomOut, Sliders, ChevronDown, Activity } from 'lucide-react';

export function TopBar({
  ptyConnected,
  activeShell,
  onShellChange,
  programMode,
  onToggleProgramMode,
  showDashboard = false,
  onToggleDashboard,
  soundMuted,
  onToggleSound,
  cabinNoiseActive,
  onToggleCabinNoise,
  atcChatterActive,
  onToggleATCChatter,
  audioSettings = {},
  onAudioSettingsChange,
  onOpenProfiles,
  onReconnect,
  uiScale = 1.0,
  onZoomInUI,
  onZoomOutUI,
  onResetUI
}) {
  const [activeMenu, setActiveMenu] = useState(null); // 'SESSION' | 'AUDIO' | 'VIEW' | null

  const menuRef = useRef(null);
  const {
    cabinVolume = 25,
    atcVolume = 35,
    atcFrequency = 2,
    ttsProvider = 'PIPER'
  } = audioSettings;

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
    onAudioSettingsChange?.({ cabinVolume: val });
  };

  const handleATCVolChange = (e) => {
    const val = parseInt(e.target.value, 10);
    onAudioSettingsChange?.({ atcVolume: val });
  };

  const handleATCFreqChange = (e) => {
    const val = parseInt(e.target.value, 10);
    onAudioSettingsChange?.({ atcFrequency: val });
  };

  const scalePercent = Math.round(uiScale * 100);

  const handleOpenProfiles = () => {
    setActiveMenu(null);
    onOpenProfiles?.();
  };

  return (
    <div className="top-bar" ref={menuRef}>
      <div className="controls-section">
        <div className="control-cluster" aria-label="Interface controls">
        {/* Flight Dashboard Toggle Button */}
        <button
          className={`icon-btn ${showDashboard ? 'active' : ''}`}
          onClick={onToggleDashboard}
          title="Toggle Flight Dashboard Display"
        >
          <Activity size={13} />
          {showDashboard ? 'DASH ON' : 'DASHBOARD'}
        </button>

        {/* Key Programmer Toggle */}
        <button
          className={`icon-btn ${programMode ? 'active' : ''}`}
          onClick={onToggleProgramMode}
          title="Toggle Key Programming Mode"
        >
          <Edit3 size={13} />
          {programMode ? 'PROG ON' : 'PROG'}
        </button>

        </div>

        <div className="control-cluster session-cluster" aria-label="Terminal session controls">
        {/* Combined terminal and profiles menu */}
        <div className="topbar-dropdown-wrap">
          <button
            className={`icon-btn ${activeMenu === 'SESSION' ? 'active' : ''}`}
            onClick={() => setActiveMenu(activeMenu === 'SESSION' ? null : 'SESSION')}
            title="Terminal selection and macro profiles"
            aria-haspopup="dialog"
            aria-expanded={activeMenu === 'SESSION'}
            aria-controls="topbar-session-menu"
          >
            <Terminal size={13} />
            SESSION
            <ChevronDown size={11} />
          </button>

          {activeMenu === 'SESSION' && (
            <div className="topbar-popover session-popover" id="topbar-session-menu" role="dialog" aria-label="Session tools">
              <div className="popover-header">
                <Terminal size={13} /> SESSION TOOLS
              </div>

              <div className="popover-row">
                <span className="popover-label">TERMINAL</span>
                <select
                  className="icon-btn session-shell-select"
                  value={activeShell}
                  onChange={(e) => onShellChange(e.target.value)}
                  title="Select Local PTY Shell"
                  aria-label="Terminal shell"
                >
                  <option value="powershell.exe">PowerShell</option>
                  <option value="cmd.exe">CMD</option>
                  <option value="bash">WSL Bash</option>
                </select>
              </div>

              <div className="popover-divider" />

              <div className="popover-row">
                <span className="popover-label">MACRO PROFILES</span>
                <button className="icon-btn" onClick={handleOpenProfiles} title="Macro Preset Profiles">
                  <Folder size={13} /> PROFILES
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Audio Popover Menu */}
        <div style={{ position: 'relative' }}>
          <button
            className={`icon-btn ${(cabinNoiseActive || atcChatterActive) ? 'active' : ''}`}
            onClick={() => setActiveMenu(activeMenu === 'AUDIO' ? null : 'AUDIO')}
            title="Audio & Sound Level Settings"
            aria-haspopup="dialog"
            aria-expanded={activeMenu === 'AUDIO'}
            aria-controls="topbar-audio-menu"
          >
            {soundMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            AUDIO
            <ChevronDown size={11} />
          </button>

          {activeMenu === 'AUDIO' && (
            <div className="topbar-popover" id="topbar-audio-menu" role="dialog" aria-label="Audio settings">
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
                  aria-label="Cabin hum volume"
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
                  aria-label="ATC volume"
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
                  aria-label="ATC chatter frequency"
                />
              </div>

              <div className="popover-divider" />

              <div className="popover-row">
                <span className="popover-label">TTS ENGINE</span>
                <select
                  className="icon-btn"
                  value={ttsProvider}
                  onChange={(e) => onAudioSettingsChange?.({ ttsProvider: e.target.value })}
                  aria-label="Text to speech engine"
                  style={{ padding: '2px 6px', fontSize: '10px' }}
                >
                  <option value="PIPER">🎙️ PIPER NEURAL</option>
                  <option value="WEBSPEECH">🗣️ WEB SPEECH</option>
                </select>
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
            aria-haspopup="dialog"
            aria-expanded={activeMenu === 'VIEW'}
            aria-controls="topbar-view-menu"
          >
            <ZoomIn size={13} />
            VIEW ({scalePercent}%)
            <ChevronDown size={11} />
          </button>

          {activeMenu === 'VIEW' && (
            <div className="topbar-popover" id="topbar-view-menu" role="dialog" aria-label="View settings">
              <div className="popover-header">
                <ZoomIn size={13} /> UI SCALE
              </div>
              <div className="popover-row" style={{ justifyContent: 'space-between', gap: 6 }}>
                <button className="icon-btn" onClick={onZoomOutUI} aria-label="Zoom out"><ZoomOut size={12} /> OUT</button>
                <button className="zoom-badge" onClick={onResetUI} title="Reset to 100%" aria-label="Reset interface scale">{scalePercent}%</button>
                <button className="icon-btn" onClick={onZoomInUI} aria-label="Zoom in"><ZoomIn size={12} /> IN</button>
              </div>
            </div>
          )}
        </div>

        {/* Reconnect Session */}
        <button
          className="icon-btn reconnect-btn"
          onClick={onReconnect}
          title="Reconnect PTY Session"
          aria-label="Reconnect PTY session"
        >
          <RefreshCw size={13} />
          <span>SYNC</span>
        </button>

        {/* PTY Connection Status Indicator */}
        <div
          className={`session-status ${ptyConnected ? 'connected' : 'error'}`}
          title={ptyConnected ? 'PTY Connected' : 'PTY Disconnected'}
          role="status"
        >
          <span className="status-dot" />
          <span>{ptyConnected ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
        </div>
      </div>
    </div>
  );
}
