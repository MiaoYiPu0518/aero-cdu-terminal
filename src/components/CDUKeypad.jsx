import React from 'react';
import { soundEngine } from '../utils/soundEngine';

export function CDUKeypad({
  bindings,
  onKeyPress,
  onKeyContextMenu,
  execStaged,
  pressedKeyId
}) {
  const handleKeyClick = (keyId, defaultChar, e) => {
    soundEngine.playKeyClick(keyId === 'EXEC');
    onKeyPress(keyId, defaultChar, e);
  };

  const handleContextMenu = (keyId, e) => {
    e.preventDefault();
    onKeyContextMenu(keyId);
  };

  const renderKey = (keyId, label, subtext = '', isExec = false) => {
    const binding = bindings[keyId];
    const isPressed = pressedKeyId === keyId;
    const hasBinding = !!(binding && binding.command);
    
    // If a custom label is set by the user, it replaces the original label!
    const displayLabel = binding?.label ? binding.label.toUpperCase() : label;
    const displaySub = !binding?.label && hasBinding ? binding.command : subtext;

    if (isExec) {
      return (
        <button
          key={keyId}
          className={`exec-key ${execStaged ? 'staged' : ''} ${isPressed ? 'key-pressed' : ''}`}
          onClick={(e) => handleKeyClick(keyId, '', e)}
          onContextMenu={(e) => handleContextMenu(keyId, e)}
          title="EXEC: Execute Staged Command or Scratchpad Buffer"
        >
          <div className="exec-light-bar" />
          <span>{displayLabel}</span>
        </button>
      );
    }

    return (
      <button
        key={keyId}
        className={`cdu-key ${hasBinding ? 'programmed' : ''} ${isPressed ? 'key-pressed' : ''}`}
        onClick={(e) => handleKeyClick(keyId, label, e)}
        onContextMenu={(e) => handleContextMenu(keyId, e)}
        title={hasBinding ? `[Bound] ${keyId}: ${binding.command}` : `Key ${keyId} (Unbound)`}
      >
        <span>{displayLabel}</span>
        {displaySub && <span className="sub-label">{displaySub}</span>}
      </button>
    );
  };

  return (
    <div className="cdu-keypad">
      {/* Top Function Rows */}
      <div className="key-row">
        {renderKey('INIT_REF', 'INIT REF')}
        {renderKey('RTE', 'RTE')}
        {renderKey('CLB', 'CLB')}
        {renderKey('CRZ', 'CRZ')}
        {renderKey('DES', 'DES')}
      </div>

      <div className="key-row exec-row">
        {renderKey('MENU', 'MENU')}
        {renderKey('LEGS', 'LEGS')}
        {renderKey('DEP_ARR', 'DEP ARR')}
        {renderKey('HOLD', 'HOLD')}
        {renderKey('PROG', 'PROG')}
        {renderKey('EXEC', 'EXEC', '', true)}
      </div>

      <div className="key-row">
        {renderKey('N1_LIMIT', 'N1 LIMIT')}
        {renderKey('FIX', 'FIX')}
        {renderKey('PREV_PAGE', 'PREV PAGE')}
        {renderKey('NEXT_PAGE', 'NEXT PAGE')}
        {renderKey('HELP', 'HELP')}
      </div>

      {/* Split Keyboard Area */}
      <div className="keyboard-split">
        {/* Numeric Cluster 3x4 */}
        <div className="num-grid">
          {renderKey('1', '1')}
          {renderKey('2', '2')}
          {renderKey('3', '3')}
          {renderKey('4', '4')}
          {renderKey('5', '5')}
          {renderKey('6', '6')}
          {renderKey('7', '7')}
          {renderKey('8', '8')}
          {renderKey('9', '9')}
          {renderKey('DOT', '.')}
          {renderKey('0', '0')}
          {renderKey('PLUS_MINUS', '+/-')}
        </div>

        {/* Alpha Cluster 5x5 */}
        <div className="alpha-grid">
          {renderKey('A', 'A')}
          {renderKey('B', 'B')}
          {renderKey('C', 'C')}
          {renderKey('D', 'D')}
          {renderKey('E', 'E')}

          {renderKey('F', 'F')}
          {renderKey('G', 'G')}
          {renderKey('H', 'H')}
          {renderKey('I', 'I')}
          {renderKey('J', 'J')}

          {renderKey('K', 'K')}
          {renderKey('L', 'L')}
          {renderKey('M', 'M')}
          {renderKey('N', 'N')}
          {renderKey('O', 'O')}

          {renderKey('P', 'P')}
          {renderKey('Q', 'Q')}
          {renderKey('R', 'R')}
          {renderKey('S', 'S')}
          {renderKey('T', 'T')}

          {renderKey('U', 'U')}
          {renderKey('V', 'V')}
          {renderKey('W', 'W')}
          {renderKey('X', 'X')}
          {renderKey('Y', 'Y')}

          {renderKey('Z', 'Z')}
          {renderKey('SP', 'SP')}
          {renderKey('DEL', 'DEL')}
          {renderKey('SLASH', '/')}
          {renderKey('CLR', 'CLR')}
        </div>
      </div>
    </div>
  );
}
