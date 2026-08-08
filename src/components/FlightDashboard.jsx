import React from 'react';
import { AnalogSixPack } from './AnalogSixPack';
import { AnalogRadarScope } from './AnalogRadarScope';
import { X, Play, RotateCcw, ShieldAlert, Zap, Compass, Activity, Sliders } from 'lucide-react';

/**
 * Left-Side Docked Virtual Flight Dashboard Container Component
 */
export function FlightDashboard({
  telemetry,
  setPreset,
  adjustPitch,
  adjustRoll,
  toggleGear,
  setFlaps,
  onClose,
  uiTheme = 'REALISTIC'
}) {
  const { pitch, roll, heading, altitude, airspeed, vsi, n1, egt, fuelFlow, fuelTotal, flaps, gearDown, preset, radarTargets } = telemetry;

  return (
    <div className={`flight-dashboard-panel ${uiTheme === 'PIXEL' ? 'pixel-theme' : ''}`}>
      {/* Panel Header */}
      <div className="dashboard-header">
        <div className="header-title-group">
          <Activity size={16} className="header-icon" />
          <span className="header-title">ANALOG FLIGHT DASHBOARD</span>
          <span className="header-badge">SIM TELEMETRY</span>
        </div>
        <button className="dashboard-close-btn" onClick={onClose} title="Hide Flight Dashboard">
          <X size={15} />
        </button>
      </div>

      {/* Main Panel Content Grid */}
      <div className="dashboard-content">
        {/* 1. Classic 6-Pack Instrument Dials */}
        <AnalogSixPack telemetry={telemetry} uiTheme={uiTheme} />

        {/* 2. Vintage CRT Analog Radar Scope */}
        <div className="dashboard-middle-row">
          <AnalogRadarScope targets={radarTargets} heading={heading} uiTheme={uiTheme} />

          {/* Engine & Cabin Environment Gauges */}
          <div className="engine-metrics-card">
            <div className="card-title">
              <Zap size={13} />
              <span>EICAS ENGINE & SYSTEMS</span>
            </div>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">ENG 1/2 N1</span>
                <span className="metric-val text-green">{n1.toFixed(1)}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">EGT TEMP</span>
                <span className="metric-val text-amber">{Math.round(egt)}°C</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">FUEL FLOW</span>
                <span className="metric-val text-cyan">{fuelFlow} KG/H</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">FUEL REMAIN</span>
                <span className="metric-val">{fuelTotal} KG</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">FLAPS</span>
                <span className="metric-val">{flaps}°</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">GEAR</span>
                <span className={`metric-val ${gearDown ? 'text-green' : 'text-muted'}`}>
                  {gearDown ? 'DOWN / LOCKED' : 'UP'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Interactive Flight Simulation Controls & Presets */}
        <div className="dashboard-controls-section">
          <div className="control-bar-label">
            <Sliders size={13} />
            <span>FLIGHT PHASE PRESETS</span>
          </div>

          <div className="preset-buttons-group">
            {['CRUISE', 'CLIMB', 'DESCENT', 'APPROACH', 'TURBULENCE', 'TAXI'].map((p) => (
              <button
                key={p}
                className={`preset-btn ${preset === p ? 'active' : ''}`}
                onClick={() => setPreset(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="manual-stick-controls">
            <div className="stick-subgroup">
              <span className="subgroup-label">MANUAL PITCH:</span>
              <button className="stick-btn" onClick={() => adjustPitch(2)}>PITCH UP (+2°)</button>
              <button className="stick-btn" onClick={() => adjustPitch(-2)}>PITCH DN (-2°)</button>
            </div>

            <div className="stick-subgroup">
              <span className="subgroup-label">BANK ROLL:</span>
              <button className="stick-btn" onClick={() => adjustRoll(-5)}>BANK LEFT</button>
              <button className="stick-btn" onClick={() => adjustRoll(5)}>BANK RIGHT</button>
            </div>

            <div className="stick-subgroup">
              <span className="subgroup-label">SYSTEMS:</span>
              <button className={`stick-btn ${gearDown ? 'active-green' : ''}`} onClick={toggleGear}>
                {gearDown ? 'GEAR: DOWN' : 'GEAR: UP'}
              </button>
              <button
                className="stick-btn"
                onClick={() => setFlaps((flaps + 15) % 45)}
              >
                FLAPS: {flaps}°
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
