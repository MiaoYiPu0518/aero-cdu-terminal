import React from 'react';
import { CDUScreen } from './CDUScreen';
import { CDUKeypad } from './CDUKeypad';

export function CDUFrame({
  ptyClient,
  scratchpad,
  bindings,
  onKeyPress,
  onKeyContextMenu,
  onLSKClick,
  execStaged,
  pressedKeyId,
  programMode,
  activePage,
  totalPages,
  fontSize,
  lastExecutedCmd
}) {
  return (
    <div className="cdu-chassis">
      {/* Screw Fasteners on Corner Frame */}
      <div className="cdu-screw screw-tl" />
      <div className="cdu-screw screw-tr" />
      <div className="cdu-screw screw-bl" />
      <div className="cdu-screw screw-br" />

      {/* Top Status Lamps */}
      <div className="status-indicators">
        <span className="indicator-lamp active">MSG</span>
        <span className="indicator-lamp">OFST</span>
        <span className="indicator-lamp">FAIL</span>
        <span className={`indicator-lamp ${execStaged ? 'exec-active' : ''}`}>EXEC</span>
      </div>

      {/* Program Mode Banner */}
      {programMode && (
        <div className="program-banner">
          ⚠️ PROGRAMMING MODE ACTIVE: CLICK ANY BUTTON TO EDIT COMMAND BINDING
        </div>
      )}

      {/* Screen Housing */}
      <CDUScreen
        ptyClient={ptyClient}
        scratchpad={scratchpad}
        onLSKClick={onLSKClick}
        bindings={bindings}
        execStaged={execStaged}
        activePage={activePage}
        totalPages={totalPages}
        fontSize={fontSize}
        lastExecutedCmd={lastExecutedCmd}
      />

      {/* Physical CDU Keypad */}
      <CDUKeypad
        bindings={bindings}
        onKeyPress={onKeyPress}
        onKeyContextMenu={onKeyContextMenu}
        execStaged={execStaged}
        pressedKeyId={pressedKeyId}
      />
    </div>
  );
}
