import React, { useState } from 'react';
import { X, Download, Upload, Layers, Check, RefreshCw } from 'lucide-react';

const PRESET_PROFILES = {
  KUBERNETES: {
    name: 'Kubernetes Cluster Ops',
    bindings: {
      A: { command: 'kubectl get svc -n default', label: 'GET SVC', autoEnter: true },
      B: { command: 'kubectl get pods -n default', label: 'GET PODS', autoEnter: true },
      C: { command: 'kubectl get deployments -n default', label: 'GET DEPLOY', autoEnter: true },
      D: { command: 'kubectl get nodes -o wide', label: 'GET NODES', autoEnter: true },
      E: { command: 'kubectl get events --sort-by=.metadata.creationTimestamp', label: 'GET EVENTS', autoEnter: true },
      '1L': { command: 'kubectl cluster-info', label: 'CLUSTER INFO', autoEnter: true },
      '2L': { command: 'kubectl top pods', label: 'TOP PODS', autoEnter: true }
    }
  },
  DEVOPS_GIT: {
    name: 'DevOps & Git Suite',
    bindings: {
      A: { command: 'git status', label: 'GIT STATUS', autoEnter: true },
      B: { command: 'git log --oneline -n 10', label: 'GIT LOG', autoEnter: true },
      C: { command: 'docker ps --format "table {{.ID}}\\t{{.Names}}\\t{{.Status}}"', label: 'DOCKER PS', autoEnter: true },
      D: { command: 'git branch -a', label: 'GIT BRANCH', autoEnter: true },
      E: { command: 'npm test', label: 'NPM TEST', autoEnter: true }
    }
  },
  NETWORK_SYS: {
    name: 'Network & System Monitoring',
    bindings: {
      A: { command: 'ipconfig /all', label: 'IPCONFIG', autoEnter: true },
      B: { command: 'ping 127.0.0.1 -n 4', label: 'PING LOCAL', autoEnter: true },
      C: { command: 'netstat -ano | findstr LISTEN', label: 'NETSTAT', autoEnter: true },
      D: { command: 'Get-Process | Sort-CPU -Descending | Select -First 10', label: 'TOP CPU', autoEnter: true }
    }
  }
};

export function ProfileModal({
  currentBindings,
  onLoadProfile,
  onClearAllBindings,
  onClose
}) {
  const [selectedPreset, setSelectedPreset] = useState('KUBERNETES');

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentBindings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aero-cdu-bindings-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          onLoadProfile(imported);
          onClose();
        } catch (err) {
          alert('Invalid JSON profile file format.');
        }
      };
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Layers size={18} className="brand-icon" />
            MACRO PRESET PROFILES
          </div>
          <button className="icon-btn" onClick={onClose} style={{ padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-label">LOAD PRESET MACRO SUITE</div>
          {Object.entries(PRESET_PROFILES).map(([key, preset]) => (
            <div
              key={key}
              className={`toggle-group ${selectedPreset === key ? 'on' : ''}`}
              style={{ cursor: 'pointer', background: selectedPreset === key ? 'rgba(0, 229, 255, 0.1)' : '#14171d', borderColor: selectedPreset === key ? 'var(--crt-cyan)' : '#333a48' }}
              onClick={() => setSelectedPreset(key)}
            >
              <div>
                <div className="form-label" style={{ color: '#fff', fontSize: 13 }}>{preset.name}</div>
                <div style={{ fontSize: 11, color: '#8a94a6', marginTop: 2 }}>
                  Includes preset key shortcuts (e.g. Button A = {preset.bindings.A?.command})
                </div>
              </div>
              <button
                className="btn-primary"
                style={{ padding: '6px 12px', fontSize: 12 }}
                onClick={() => {
                  onLoadProfile(preset.bindings);
                  onClose();
                }}
              >
                APPLY
              </button>
            </div>
          ))}

          <hr style={{ borderColor: '#2f3542', margin: '4px 0' }} />

          <div className="form-label">PROFILE BACKUP & RESTORE</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={handleExportJSON}>
              <Download size={14} /> EXPORT JSON
            </button>

            <label className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
              <Upload size={14} /> IMPORT JSON
              <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
            </label>
          </div>

          <button
            className="btn-danger"
            style={{ width: '100%', marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => {
              if (confirm('Are you sure you want to clear all key bindings?')) {
                onClearAllBindings();
                onClose();
              }
            }}
          >
            <RefreshCw size={14} /> RESET ALL KEYS TO UNBOUND
          </button>
        </div>
      </div>
    </div>
  );
}
