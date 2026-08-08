import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { CDUFrame } from './components/CDUFrame';
import { KeyProgrammerModal } from './components/KeyProgrammerModal';
import { ProfileModal } from './components/ProfileModal';
import { FlightDashboard } from './components/FlightDashboard';
import { PTYClient } from './utils/ptyClient';
import { soundEngine } from './utils/soundEngine';
import { useFlightSimulator } from './utils/useFlightSimulator';

export function App() {
  const [bindings, setBindings] = useState({});
  const [scratchpad, setScratchpad] = useState('');
  const [lastExecutedCmd, setLastExecutedCmd] = useState('');
  const [execStaged, setExecStaged] = useState(false);
  const [programMode, setProgramMode] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [activeShell, setActiveShell] = useState('powershell.exe');
  const [soundMuted, setSoundMuted] = useState(false);
  const [cabinNoiseActive, setCabinNoiseActive] = useState(false);
  const [atcChatterActive, setAtcChatterActive] = useState(false);
  const [ptyConnected, setPtyConnected] = useState(false);

  // Initialize Flight Simulator Engine
  const {
    telemetry,
    setPreset,
    toggleAutoFlight,
    toggleRandomManeuvers,
    setSimSpeed,
    setRadarRange,
    setRadarMode,
    setSelectedTarget,
    adjustPitch,
    adjustRoll,
    toggleGear,
    setFlaps
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

  // UI Theme State ('REALISTIC' | 'PIXEL')
  const [uiTheme, setUiTheme] = useState(() => {
    return localStorage.getItem('aero_cdu_theme') || 'REALISTIC';
  });

  // React state for ptyClient
  const [ptyClient, setPtyClient] = useState(null);

  useEffect(() => {
    const client = new PTYClient();
    client.onStatus((status) => {
      setPtyConnected(status === 'CONNECTED');
    });

    client.connect(activeShell, 80, 24);
    setPtyClient(client);

    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.bindings && Object.keys(data.bindings).length > 0) {
            setBindings(data.bindings);
          }
          if (data.uiTheme) {
            setUiTheme(data.uiTheme);
            localStorage.setItem('aero_cdu_theme', data.uiTheme);
          }
        }
      })
      .catch(() => {});

    return () => {
      client.disconnect();
    };
  }, []);

  const saveConfigToStorage = (newBindings = bindings, newTheme = uiTheme, newShell = activeShell) => {
    setBindings(newBindings);
    setUiTheme(newTheme);
    localStorage.setItem('aero_cdu_theme', newTheme);
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bindings: newBindings, activeShell: newShell, uiTheme: newTheme }),
    }).catch(() => {});
  };

  const handleThemeChange = (newTheme) => {
    setUiTheme(newTheme);
    saveConfigToStorage(bindings, newTheme, activeShell);
  };

  const handleShellChange = (newShell) => {
    setActiveShell(newShell);
    if (ptyClient) {
      ptyClient.disconnect();
    }
    const newClient = new PTYClient();
    newClient.onStatus((status) => {
      setPtyConnected(status === 'CONNECTED');
    });
    newClient.connect(newShell, 80, 24);
    setPtyClient(newClient);
  };

  const handleReconnect = () => {
    if (ptyClient) {
      ptyClient.disconnect();
    }
    const newClient = new PTYClient();
    newClient.onStatus((status) => {
      setPtyConnected(status === 'CONNECTED');
    });
    newClient.connect(activeShell, 80, 24);
    setPtyClient(newClient);
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
    setUiScale((prev) => Math.min(parseFloat((prev + 0.1).toFixed(1)), 1.6));
  };

  const handleZoomOutUI = () => {
    setUiScale((prev) => Math.max(parseFloat((prev - 0.1).toFixed(1)), 0.6));
  };

  const handleResetUI = () => {
    setUiScale(1.0);
  };

  const handleToggleCabinNoise = () => {
    const newState = soundEngine.toggleCockpitNoise();
    setCabinNoiseActive(newState);
  };

  const handleToggleATCChatter = () => {
    const newState = soundEngine.toggleATCChatter();
    setAtcChatterActive(newState);
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
    saveConfigToStorage(updated);
    setActiveModal(null);
    setEditingKeyId(null);
  };

  const handleUnbindKey = (keyId) => {
    const updated = { ...bindings };
    delete updated[keyId];
    saveConfigToStorage(updated);
    setActiveModal(null);
    setEditingKeyId(null);
  };

  const handleLoadProfile = (profileBindings) => {
    saveConfigToStorage(profileBindings);
  };

  const handleClearAllBindings = () => {
    saveConfigToStorage({});
  };

  return (
    <div className={`app-container ${showDashboard ? 'has-dashboard' : ''}`} data-theme={uiTheme}>
      <TopBar
        ptyConnected={ptyConnected}
        activeShell={activeShell}
        onShellChange={handleShellChange}
        uiTheme={uiTheme}
        onThemeChange={handleThemeChange}
        programMode={programMode}
        onToggleProgramMode={() => setProgramMode(!programMode)}
        showDashboard={showDashboard}
        onToggleDashboard={() => setShowDashboard(!showDashboard)}
        soundMuted={soundMuted}
        onToggleSound={() => setSoundMuted(soundEngine.toggleMute())}
        cabinNoiseActive={cabinNoiseActive}
        onToggleCabinNoise={handleToggleCabinNoise}
        atcChatterActive={atcChatterActive}
        onToggleATCChatter={handleToggleATCChatter}
        onOpenProfiles={() => setActiveModal('PROFILES')}
        onReconnect={handleReconnect}
        uiScale={uiScale}
        onZoomInUI={handleZoomInUI}
        onZoomOutUI={handleZoomOutUI}
        onResetUI={handleResetUI}
      />

      {/* Main Cockpit Layout containing Left Dashboard & Right CDU Unit */}
      <div className="cockpit-main-layout">
        {/* Left Side Flight Dashboard Panel */}
        {showDashboard && (
          <FlightDashboard
            telemetry={telemetry}
            setPreset={setPreset}
            toggleAutoFlight={toggleAutoFlight}
            toggleRandomManeuvers={toggleRandomManeuvers}
            setSimSpeed={setSimSpeed}
            setRadarRange={setRadarRange}
            setRadarMode={setRadarMode}
            setSelectedTarget={setSelectedTarget}
            adjustPitch={adjustPitch}
            adjustRoll={adjustRoll}
            toggleGear={toggleGear}
            setFlaps={setFlaps}
            onClose={() => setShowDashboard(false)}
            uiTheme={uiTheme}
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
            uiTheme={uiTheme}
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
