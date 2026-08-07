import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { eventToAnsi } from '../utils/keyboardHelper';
import '@xterm/xterm/css/xterm.css';

export function CDUScreen({
  ptyClient,
  scratchpad,
  onLSKClick,
  bindings,
  execStaged,
  activePage,
  totalPages,
  fontSize = 13,
  lastExecutedCmd = ''
}) {
  const terminalContainerRef = useRef(null);
  const xtermInstance = useRef(null);
  const fitAddonInstance = useRef(null);

  // 1. Initialize XTerm Instance & ResizeObserver
  useEffect(() => {
    if (!terminalContainerRef.current) return;

    const term = new XTerm({
      fontFamily: "'Share Tech Mono', 'Courier New', monospace",
      fontSize: fontSize,
      lineHeight: 1.0,
      letterSpacing: 0,
      cursorStyle: 'block',
      cursorInactiveStyle: 'block',
      cursorBlink: true,
      allowProposedApi: true,
      theme: {
        background: '#020804',
        foreground: '#00ff66',
        cursor: '#00ff66',
        cursorAccent: '#020804',
        selectionBackground: 'rgba(0, 255, 102, 0.3)',
        black: '#000000',
        red: '#ff5555',
        green: '#00ff66',
        yellow: '#ffb000',
        blue: '#00e5ff',
        magenta: '#ff00ff',
        cyan: '#00e5ff',
        white: '#ffffff',
        brightBlack: '#555555',
        brightGreen: '#55ff55',
        brightCyan: '#55ffff'
      },
      cols: 80,
      rows: 24
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalContainerRef.current);

    xtermInstance.current = term;
    fitAddonInstance.current = fitAddon;

    const safeFit = () => {
      if (fitAddonInstance.current && xtermInstance.current) {
        try {
          fitAddonInstance.current.fit();
          const { cols, rows } = xtermInstance.current;
          if (cols > 0 && rows > 0 && ptyClient) {
            ptyClient.resize(cols, rows);
          }
        } catch (e) {}
      }
    };

    // Initial fit delayed slightly to ensure DOM layout bounds are computed
    const timer = setTimeout(() => {
      safeFit();
      term.focus();
    }, 150);

    // ResizeObserver for container bounds changes
    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && terminalContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        safeFit();
      });
      resizeObserver.observe(terminalContainerRef.current);
    }

    const handleWindowResize = () => safeFit();
    window.addEventListener('resize', handleWindowResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleWindowResize);
      if (resizeObserver) resizeObserver.disconnect();
      term.dispose();
    };
  }, []);

  // Dynamic Font Size update
  useEffect(() => {
    if (xtermInstance.current) {
      xtermInstance.current.options.fontSize = fontSize;
      if (fitAddonInstance.current) {
        try {
          fitAddonInstance.current.fit();
          const { cols, rows } = xtermInstance.current;
          if (cols > 0 && rows > 0 && ptyClient) {
            ptyClient.resize(cols, rows);
          }
        } catch (e) {}
      }
    }
  }, [fontSize, ptyClient]);

  // 2. Wire PTY WebSocket stream and physical keyboard listener
  useEffect(() => {
    if (!ptyClient || !xtermInstance.current) return;

    // Reset XTerm buffer on new PTY connection
    try {
      xtermInstance.current.reset();
    } catch (e) {}

    // Output from PTY backend to XTerm
    const removeDataListener = ptyClient.onData((data) => {
      if (xtermInstance.current) {
        xtermInstance.current.write(data);
      }
    });

    // Send initial newline or resize to trigger prompt rendering if shell is idle
    if (ptyClient && xtermInstance.current) {
      const { cols, rows } = xtermInstance.current;
      if (cols > 0 && rows > 0) {
        ptyClient.resize(cols, rows);
      }
    }

    // Native XTerm onData input handler
    const onDataDisposable = xtermInstance.current.onData((data) => {
      if (ptyClient) {
        ptyClient.sendInput(data);
      }
    });

    // Global KeyDown Listener -> routes physical keyboard events to PTY when terminal/inputs are not focused
    const handleGlobalKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
        return;
      }

      const ansi = eventToAnsi(e);
      if (ansi && ptyClient) {
        if (e.key === 'Tab' || e.key === 'Backspace') e.preventDefault();
        ptyClient.sendInput(ansi);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      if (onDataDisposable) onDataDisposable.dispose();
      if (removeDataListener) removeDataListener();
    };
  }, [ptyClient]);

  const handleScreenClick = () => {
    if (xtermInstance.current) {
      xtermInstance.current.focus();
    }
  };

  const getLSKBinding = (keyId) => bindings[keyId] || null;

  const getScratchpadDisplay = () => {
    if (scratchpad) return scratchpad.toUpperCase();
    if (lastExecutedCmd) return lastExecutedCmd.toUpperCase();
    return 'READY - TYPE OR CLICK MACRO';
  };

  return (
    <div className="cdu-screen-housing">
      {/* Left Line Select Keys (1L - 6L) */}
      <div className="lsk-column">
        {['1L', '2L', '3L', '4L', '5L', '6L'].map((lskId) => {
          const b = getLSKBinding(lskId);
          let buttonIcon = '<';
          let titleText = `LSK ${lskId}`;

          if (lskId === '1L') {
            buttonIcon = '+';
            titleText = b ? `LSK 1L: ${b.command}` : 'LSK 1L: ZOOM IN (+)';
          } else if (lskId === '2L') {
            buttonIcon = '-';
            titleText = b ? `LSK 2L: ${b.command}` : 'LSK 2L: ZOOM OUT (-)';
          } else if (b) {
            titleText = `LSK ${lskId}: ${b.command}`;
          }

          return (
            <button
              key={lskId}
              className={`lsk-button ${b ? 'pressed' : ''} ${lskId === '1L' || lskId === '2L' ? 'zoom-btn' : ''}`}
              onClick={() => onLSKClick(lskId)}
              title={titleText}
            >
              {buttonIcon}
            </button>
          );
        })}
      </div>

      {/* CRT Display Container */}
      <div className="crt-display-frame" onClick={handleScreenClick}>
        <div className="crt-scanlines" />
        <div className="crt-glass-reflection" />
        <div className="crt-phosphor-glow" />

        <div className="crt-content">
          {/* Header Line */}
          <div className="crt-header">
            <span className="crt-title">NAV TERM STATUS</span>
            <span className="crt-page-num">PAGE {activePage}/{totalPages}</span>
          </div>

          {/* Embedded Interactive XTerm Terminal */}
          <div className="terminal-layer" ref={terminalContainerRef} />

          {/* Scratchpad Line at Screen Bottom */}
          <div className="crt-scratchpad">
            <span className="scratchpad-prompt">&lt;</span>
            <span className="scratchpad-text">
              {getScratchpadDisplay()}
            </span>
            <span className="scratchpad-cursor" />
          </div>
        </div>
      </div>

      {/* Right Line Select Keys (1R - 6R) */}
      <div className="lsk-column">
        {['1R', '2R', '3R', '4R', '5R', '6R'].map((lskId) => {
          const b = getLSKBinding(lskId);
          return (
            <button
              key={lskId}
              className={`lsk-button ${b ? 'pressed' : ''}`}
              onClick={() => onLSKClick(lskId)}
              title={b ? `LSK ${lskId}: ${b.command}` : `LSK ${lskId} (Unbound)`}
            >
              &gt;
            </button>
          );
        })}
      </div>
    </div>
  );
}
