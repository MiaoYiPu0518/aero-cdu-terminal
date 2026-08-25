import React, { useState, useEffect, useRef } from 'react';
import { TopBar } from './components/TopBar';
import { CDUFrame } from './components/CDUFrame';
import { KeyProgrammerModal } from './components/KeyProgrammerModal';
import { ProfileModal } from './components/ProfileModal';
import { FlightDashboard } from './components/FlightDashboard';
import { PTYClient } from './utils/ptyClient';
import { soundEngine } from './utils/soundEngine';
import { useFlightSimulator } from './utils/useFlightSimulator';

const DEFAULT_AUDIO_SETTINGS = {
  cabinVolume: 25,
  atcVolume: 35,
  atcFrequency: 2,
  ttsProvider: 'PIPER'
};

const SUPPORTED_SHELLS = ['powershell.exe', 'cmd.exe', 'bash'];

const normalizeUiScale = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 1.0;
  return Math.min(1.6, Math.max(0.6, parseFloat(numericValue.toFixed(1))));
};

const normalizeRange = (value, fallback, min, max) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numericValue)));
};

const normalizeAudioSettings = (settings = {}) => {
  const source = settings && typeof settings === 'object' ? settings : {};
  return {
    cabinVolume: normalizeRange(source.cabinVolume, DEFAULT_AUDIO_SETTINGS.cabinVolume, 0, 100),
    atcVolume: normalizeRange(source.atcVolume, DEFAULT_AUDIO_SETTINGS.atcVolume, 0, 100),
    atcFrequency: normalizeRange(source.atcFrequency, DEFAULT_AUDIO_SETTINGS.atcFrequency, 1, 4),
    ttsProvider: source.ttsProvider === 'WEBSPEECH' ? 'WEBSPEECH' : 'PIPER'
  };
};

export function App() {
  const [bindings, setBindings] = useState({});
  const [scratchpad, setScratchpad] = useState('');
  const [lastExecutedCmd, setLastExecutedCmd] = useState('');
  const [execStaged, setExecStaged] = useState(false);
  const [programMode, setProgramMode] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [activeShell, setActiveShell] = useState('powershell.exe');
  const [soundMuted, setSoundMuted] = useState(() => soundEngine.muted);
  const [cabinNoiseActive, setCabinNoiseActive] = useState(() => soundEngine.noisePlaying);
  const [atcChatterActive, setAtcChatterActive] = useState(() => soundEngine.chatterActive);
  const [ptyConnected, setPtyConnected] = useState(false);
  const [audioSettings, setAudioSettings] = useState(DEFAULT_AUDIO_SETTINGS);
  const audioSettingsRef = useRef(DEFAULT_AUDIO_SETTINGS);

  // Initialize Flight Simulator Engine
  const {
    telemetry,
    toggleAutoFlight,
    toggleRandomManeuvers,
    togglePanicMode,
    nextRoute,
    setSimSpeed
  } = useFlightSimulator(showDashboard);

  const [activeModal, setActiveModal] = useState(null);
  const [editingKeyId, setEditingKeyId] = useState(null);
  const [pressedKeyId, setPressedKeyId] = useState(null);

  const [activePage, setActivePage] = useState(1);
  const totalPages = 3;

  // Terminal CRT Font Size
  const [fontSize, setFontSize] = useState(13);

  // Entire CDU UI Scale
  const [uiScale, setUiScale] = useState(1.0);
  const uiScaleRef = useRef(1.0);

  // React state for ptyClient
  const [ptyClient, setPtyClient] = useState(null);
  const activePtyClientRef = useRef(null);

  const replacePtyClient = (shell) => {
    const previousClient = activePtyClientRef.current;
    if (previousClient) {
      previousClient.disconnect();
    }

    const nextClient = new PTYClient();
    nextClient.onStatus((status) => {
      if (activePtyClientRef.current !== nextClient) return;
      setPtyConnected(status === 'CONNECTED');
    });

    activePtyClientRef.current = nextClient;
    setPtyClient(nextClient);
    nextClient.connect(shell);
  };

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      let data = {};
      try {
        const response = await fetch('/api/config');
        if (response.ok) data = await response.json();
      } catch (e) {
        // Fall back to the local defaults when the backend is unavailable.
      }

      if (cancelled) return;

      const restoredShell = SUPPORTED_SHELLS.includes(data.activeShell) ? data.activeShell : 'powershell.exe';
      const restoredAudio = normalizeAudioSettings(data.audio);
      const restoredUiScale = normalizeUiScale(data.uiScale);

      if (data.bindings && Object.keys(data.bindings).length > 0) {
        setBindings(data.bindings);
      }
      setActiveShell(restoredShell);
      audioSettingsRef.current = restoredAudio;
      setAudioSettings(restoredAudio);
      soundEngine.setCabinVolume(restoredAudio.cabinVolume / 100);
      soundEngine.setATCVolume(restoredAudio.atcVolume / 100);
      soundEngine.setATCChatterFrequency(restoredAudio.atcFrequency);
      soundEngine.setTTSProvider(restoredAudio.ttsProvider);
      uiScaleRef.current = restoredUiScale;
      setUiScale(restoredUiScale);

      replacePtyClient(restoredShell);
    };

    initialize();

    return () => {
      cancelled = true;
      const client = activePtyClientRef.current;
      activePtyClientRef.current = null;
      if (client) client.disconnect();
    };
  }, []);

  const saveConfigToStorage = ({
    newBindings = bindings,
    newShell = activeShell,
    newAudio = audioSettingsRef.current,
    newUiScale = uiScaleRef.current
  } = {}) => {
    setBindings(newBindings);
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bindings: newBindings,
        activeShell: newShell,
        audio: newAudio,
        uiScale: newUiScale
      }),
    }).catch(() => {});
  };

  const handleShellChange = (newShell) => {
    setActiveShell(newShell);
    replacePtyClient(newShell);
    saveConfigToStorage({ newShell });
  };

  const handleReconnect = () => {
    replacePtyClient(activeShell);
  };

  // Zoom handlers for CRT font size (LSK 1L and LSK 2L)
  const handleZoomIn = () => {
    setFontSize((prev) => Math.min(prev + 1, 24));
  };

  const handleZoomOut = () => {
    setFontSize((prev) => Math.max(prev - 1, 9));
  };

  // Entire UI Scale Handlers
  const handleZoomInUI = () => {
    const nextScale = normalizeUiScale(uiScale + 0.1);
    uiScaleRef.current = nextScale;
    setUiScale(nextScale);
    saveConfigToStorage({ newUiScale: nextScale });
  };

  const handleZoomOutUI = () => {
    const nextScale = normalizeUiScale(uiScale - 0.1);
    uiScaleRef.current = nextScale;
    setUiScale(nextScale);
    saveConfigToStorage({ newUiScale: nextScale });
  };

  const handleResetUI = () => {
    uiScaleRef.current = 1.0;
    setUiScale(1.0);
    saveConfigToStorage({ newUiScale: 1.0 });
  };

  const handleAudioSettingsChange = (partialSettings) => {
    const nextSettings = normalizeAudioSettings({ ...audioSettingsRef.current, ...partialSettings });
    audioSettingsRef.current = nextSettings;
    setAudioSettings(nextSettings);

    if (Object.prototype.hasOwnProperty.call(partialSettings, 'cabinVolume')) {
      soundEngine.setCabinVolume(nextSettings.cabinVolume / 100);
    }
    if (Object.prototype.hasOwnProperty.call(partialSettings, 'atcVolume')) {
      soundEngine.setATCVolume(nextSettings.atcVolume / 100);
    }
    if (Object.prototype.hasOwnProperty.call(partialSettings, 'atcFrequency')) {
      soundEngine.setATCChatterFrequency(nextSettings.atcFrequency);
    }
    if (Object.prototype.hasOwnProperty.call(partialSettings, 'ttsProvider')) {
      soundEngine.setTTSProvider(nextSettings.ttsProvider);
    }

    saveConfigToStorage({ newAudio: nextSettings });
  };

  const handleToggleCabinNoise = () => {
    const newState = soundEngine.toggleCockpitNoise();
    setCabinNoiseActive(newState);
  };

  const handleToggleATCChatter = () => {
    const newState = soundEngine.toggleATCChatter();
    setAtcChatterActive(newState);
  };

  const handleToggleSound = () => {
    const newMutedState = soundEngine.toggleMute();
    setSoundMuted(newMutedState);
    setCabinNoiseActive(soundEngine.noisePlaying);
    setAtcChatterActive(soundEngine.chatterActive);
  };

  // Keyboard button press handler
  const handleKeyPress = (keyId, defaultChar = '', e) => {
    setPressedKeyId(keyId);
    setTimeout(() => setPressedKeyId(null), 150);

    // If Program Mode is active, open key binding editor
    if (programMode) {
      setEditingKeyId(keyId);
      setActiveModal('PROGRAM');
      return;
    }

    // Handle Zoom In on LSK 1L (if unbound)
    if (keyId === '1L' && !bindings['1L']) {
      handleZoomIn();
      soundEngine.playKeyClick(false);
      setLastExecutedCmd(`ZOOM IN (${fontSize + 1}px)`);
      return;
    }

    // Handle Zoom Out on LSK 2L (if unbound)
    if (keyId === '2L' && !bindings['2L']) {
      handleZoomOut();
      soundEngine.playKeyClick(false);
      setLastExecutedCmd(`ZOOM OUT (${fontSize - 1}px)`);
      return;
    }

    // Handle Force Stop on LSK 3L (if unbound)
    if (keyId === '3L' && !bindings['3L']) {
      if (ptyClient) {
        ptyClient.sendInput('\x03');
      }
      soundEngine.playKeyClick(true);
      setLastExecutedCmd('FORCE STOP (SIGINT)');
      return;
    }

    const bound = bindings[keyId];

    // 1. If button has a macro command bound
    if (bound && bound.command) {
      setLastExecutedCmd(bound.command);
      if (bound.autoEnter) {
        if (ptyClient) {
          ptyClient.sendInput(bound.command + '\r');
        }
        soundEngine.playExecChime();
        setScratchpad('');
        setExecStaged(false);
      } else {
        if (ptyClient) {
          ptyClient.sendInput(bound.command);
        }
        setScratchpad('');
        setExecStaged(false);
        setTimeout(() => {
          const helperArea = document.querySelector('.xterm-helper-textarea');
          if (helperArea) helperArea.focus();
        }, 10);
      }
      return;
    }

    // 2. Special Key actions
    if (keyId === 'EXEC') {
      if (scratchpad) {
        setLastExecutedCmd(scratchpad);
        if (ptyClient) {
          ptyClient.sendInput(scratchpad + '\r');
        }
        soundEngine.playExecChime();
        setScratchpad('');
        setExecStaged(false);
      }
      return;
    }

    if (keyId === 'CLR') {
      setScratchpad('');
      setExecStaged(false);
      return;
    }

    if (keyId === 'DEL') {
      if (scratchpad) {
        setScratchpad((prev) => prev.slice(0, -1));
        if (scratchpad.length <= 1) setExecStaged(false);
      } else if (ptyClient) {
        ptyClient.sendInput('\x08');
      }
      return;
    }

    if (keyId === 'SP') {
      setScratchpad((prev) => prev + ' ');
      return;
    }

    if (keyId === 'PREV_PAGE') {
      setActivePage((prev) => (prev > 1 ? prev - 1 : totalPages));
      return;
    }

    if (keyId === 'NEXT_PAGE') {
      setActivePage((prev) => (prev < totalPages ? prev + 1 : 1));
      return;
    }

    // 3. Unbound alpha/numeric buttons clicked via mouse
    if (defaultChar && e) {
      if (ptyClient) {
        ptyClient.sendInput(defaultChar);
      }
      setTimeout(() => {
        const helperArea = document.querySelector('.xterm-helper-textarea');
        if (helperArea) helperArea.focus();
      }, 10);
    }
  };

  // Sync physical keyboard keypresses for visual key feedback
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      if (activeTag === 'INPUT' || (activeTag === 'TEXTAREA' && !document.activeElement.classList.contains('xterm-helper-textarea'))) {
        return;
      }
      const char = e.key.toUpperCase();
      if (char.length === 1 && char >= 'A' && char <= 'Z') {
        setPressedKeyId(char);
        setTimeout(() => setPressedKeyId(null), 120);
      } else if (char >= '0' && char <= '9') {
        setPressedKeyId(char);
        setTimeout(() => setPressedKeyId(null), 120);
      } else if (e.key === 'Backspace') {
        setPressedKeyId('DEL');
        setTimeout(() => setPressedKeyId(null), 120);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleKeyContextMenu = (keyId) => {
    setEditingKeyId(keyId);
    setActiveModal('PROGRAM');
  };

  const handleLSKClick = (lskId) => {
    handleKeyPress(lskId, '', null);
  };

  const handleSaveKeyBinding = (keyId, bindingData) => {
    const updated = { ...bindings, [keyId]: bindingData };
    saveConfigToStorage({ newBindings: updated });
    setActiveModal(null);
    setEditingKeyId(null);
  };

  const handleUnbindKey = (keyId) => {
    const updated = { ...bindings };
    delete updated[keyId];
    saveConfigToStorage({ newBindings: updated });
    setActiveModal(null);
    setEditingKeyId(null);
  };

  const handleLoadProfile = (profileBindings) => {
    saveConfigToStorage({ newBindings: profileBindings });
  };

  const handleClearAllBindings = () => {
    saveConfigToStorage({ newBindings: {} });
  };

  return (
    <div className={`app-container ${showDashboard ? 'has-dashboard' : ''}`}>
      <TopBar
        ptyConnected={ptyConnected}
        activeShell={activeShell}
        onShellChange={handleShellChange}
        programMode={programMode}
        onToggleProgramMode={() => setProgramMode((prev) => !prev)}
        showDashboard={showDashboard}
        onToggleDashboard={() => setShowDashboard((prev) => !prev)}
        soundMuted={soundMuted}
        onToggleSound={handleToggleSound}
        cabinNoiseActive={cabinNoiseActive}
        onToggleCabinNoise={handleToggleCabinNoise}
        atcChatterActive={atcChatterActive}
        onToggleATCChatter={handleToggleATCChatter}
        audioSettings={audioSettings}
        onAudioSettingsChange={handleAudioSettingsChange}
        onOpenProfiles={() => setActiveModal('PROFILES')}
        onReconnect={handleReconnect}
        uiScale={uiScale}
        onZoomInUI={handleZoomInUI}
        onZoomOutUI={handleZoomOutUI}
        onResetUI={handleResetUI}
      />

      {/* Main Cockpit Layout containing Left Dashboard & Right CDU Unit */}
      <div className={`cockpit-main-layout ${showDashboard && uiScale > 1 ? 'scaled-cdu-layout' : ''}`}>
        {/* Left Side Flight Dashboard Panel */}
        {showDashboard && (
          <FlightDashboard
            telemetry={telemetry}
            toggleAutoFlight={toggleAutoFlight}
            toggleRandomManeuvers={toggleRandomManeuvers}
            togglePanicMode={togglePanicMode}
            nextRoute={nextRoute}
            setSimSpeed={setSimSpeed}
            onClose={() => setShowDashboard(false)}
          />
        )}

        {/* Right Side Main 3D CDU Unit Wrapper */}
        <div className="cdu-unit-wrapper" style={{ transform: `scale(${uiScale})`, transformOrigin: 'top center', transition: 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
          <CDUFrame
            ptyClient={ptyClient}
            scratchpad={scratchpad}
            bindings={bindings}
            onKeyPress={handleKeyPress}
            onKeyContextMenu={handleKeyContextMenu}
            onLSKClick={handleLSKClick}
            execStaged={execStaged}
            pressedKeyId={pressedKeyId}
            programMode={programMode}
            activePage={activePage}
            totalPages={totalPages}
            fontSize={fontSize}
            lastExecutedCmd={lastExecutedCmd}
          />
        </div>
      </div>

      {/* Key Programmer Dialog */}
      {activeModal === 'PROGRAM' && editingKeyId && (
        <KeyProgrammerModal
          keyId={editingKeyId}
          existingBinding={bindings[editingKeyId]}
          onSave={handleSaveKeyBinding}
          onUnbind={handleUnbindKey}
          onClose={() => {
            setActiveModal(null);
            setEditingKeyId(null);
          }}
        />
      )}

      {/* Profiles Modal */}
      {activeModal === 'PROFILES' && (
        <ProfileModal
          currentBindings={bindings}
          onLoadProfile={handleLoadProfile}
          onClearAllBindings={handleClearAllBindings}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
