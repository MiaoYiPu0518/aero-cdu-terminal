import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Code, Tag } from 'lucide-react';

export function KeyProgrammerModal({
  keyId,
  existingBinding,
  onSave,
  onUnbind,
  onClose
}) {
  const [command, setCommand] = useState('');
  const [label, setLabel] = useState('');
  const [autoEnter, setAutoEnter] = useState(true);

  useEffect(() => {
    if (existingBinding) {
      setCommand(existingBinding.command || '');
      setLabel(existingBinding.label || '');
      setAutoEnter(existingBinding.autoEnter !== false);
    } else {
      setCommand('');
      setLabel('');
      setAutoEnter(true);
    }
  }, [keyId, existingBinding]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(keyId, {
      command: command.trim(),
      label: label.trim(),
      autoEnter
    });
  };

  const handleCommandKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Code size={18} className="brand-icon" />
            PROGRAM CDU BUTTON
            <span className="modal-key-badge">{keyId}</span>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor={`program-command-${keyId}`}>
                COMMAND / SCRIPT TO EXECUTE
              </label>
              <span className="form-label-meta">MULTI-LINE</span>
            </div>
            <textarea
              id={`program-command-${keyId}`}
              className="form-input command-input"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleCommandKeyDown}
              placeholder={'kubectl get svc -n default\n# Add more lines for a shell script'}
              rows={6}
              spellCheck={false}
              wrap="off"
              aria-describedby="program-command-hint"
              autoFocus
              required
            />
            <div className="form-hint" id="program-command-hint">
              Enter adds a new line · Ctrl+Enter saves · Runs in the selected terminal shell
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">BUTTON LABEL / SHORT TITLE (OPTIONAL)</label>
            <input
              type="text"
              className="form-input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. OSAP SVC"
              maxLength={12}
            />
          </div>

          <div className="toggle-group">
            <div>
              <div className="form-label" style={{ color: '#fff' }}>AUTO-EXECUTE (ENTER)</div>
              <div style={{ fontSize: 11, color: '#8a94a6', marginTop: 2 }}>
                {autoEnter ? 'Run command immediately on click' : 'Copy command to terminal prompt without Enter'}
              </div>
            </div>
            <div
              className={`toggle-switch ${autoEnter ? 'on' : ''}`}
              onClick={() => setAutoEnter(!autoEnter)}
            >
              <div className="toggle-handle" />
            </div>
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Save size={16} /> SAVE BINDING
            </button>

            {existingBinding && (
              <button
                type="button"
                className="btn-danger"
                onClick={() => onUnbind(keyId)}
                title="Remove macro binding from this key"
              >
                <Trash2 size={16} />
              </button>
            )}

            <button type="button" className="btn-secondary" onClick={onClose}>
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
