import React, { lazy, Suspense, useState } from 'react';
import { AnalogSixPack } from './AnalogSixPack';
import { AnalogRadarScope } from './AnalogRadarScope';
import { X, Activity, Zap, Sliders, ShieldAlert, Navigation, Compass, AlertTriangle, Crosshair, Play, FastForward, RotateCcw } from 'lucide-react';

const TerrainFlightMap = lazy(() => import('./TerrainFlightMap').then((module) => ({ default: module.TerrainFlightMap })));

/**
 * Left-Side Docked Virtual Flight Dashboard Container Component
 */
export function FlightDashboard({
  telemetry,
  setPreset,
  toggleAutoFlight,
  toggleRandomManeuvers,
  togglePanicMode,
  nextRoute,
  setSimSpeed,
  setRadarRange,
  setRadarMode,
  setSelectedTarget,
  adjustPitch,
  adjustRoll,
  toggleGear,
  setFlaps,
  onClose,
  uiTheme = 'REALISTIC'
}) {
  const [showFlightControls, setShowFlightControls] = useState(false);
  const {
    pitch, roll, heading, altitude, airspeed, vsi, n1, egt, fuelFlow, fuelTotal, flaps, gearDown,
    preset, autoFlightMode, randomManeuversEnabled, panicMode, simSpeed, origin, destination, routeName,
    distRemainingNM, totalDistNM, legProgressPct, eteFormatted, activeEvent, tcasAlert, radarRangeNM,
    radarMode, selectedTarget, weatherCells, radarTargets
  } = telemetry;

  const isPixel = uiTheme === 'PIXEL';
  const progressPct = Number.isFinite(legProgressPct)
    ? Math.min(100, Math.max(0, legProgressPct))
    : 0;
  const remainingNm = Number.isFinite(distRemainingNM) ? distRemainingNM : 0;
  const totalNm = Number.isFinite(totalDistNM) ? totalDistNM : 0;

  return (
    <div className={`flight-dashboard-panel ${isPixel ? 'pixel-theme' : ''} ${panicMode ? 'panic-active' : ''}`}>
      {/* Panel Header & Controls */}
      <div className="dashboard-header">
        <div className="header-title-group">
          <Activity size={16} className={`header-icon ${panicMode ? 'text-red' : ''}`} />
          <span className="header-title">ANALOG FLIGHT DASHBOARD</span>
          <span className={`header-badge ${panicMode ? 'badge-red' : ''}`}>
            {panicMode ? '🚨 MAYDAY 7700' : autoFlightMode ? 'AUTO MODE' : 'MANUAL'}
          </span>
        </div>
        <button className="dashboard-close-btn" onClick={onClose} title="Hide Flight Dashboard">
          <X size={15} />
        </button>
      </div>

      {/* Flight Mode & Speed Toolbar */}
      <div className="dashboard-toolbar">
        <div className="toolbar-group">
          <button
            className={`toolbar-btn ${autoFlightMode ? 'active-green' : ''}`}
            onClick={toggleAutoFlight}
            title="Toggle Automatic Flight Phase State Machine"
          >
            {autoFlightMode ? '🤖 AUTO FLIGHT: ON' : '🖐️ MANUAL FLIGHT'}
          </button>

          <button
            className={`toolbar-btn ${randomManeuversEnabled ? 'active-amber' : ''}`}
            onClick={toggleRandomManeuvers}
            title="Toggle Random Tactical Maneuvers & Events"
          >
            {randomManeuversEnabled ? '🎲 MANEUVERS: ON' : '🎲 MANEUVERS: OFF'}
          </button>

          {/* Panic Emergency Button (Default OFF) */}
          <button
            className={`toolbar-btn panic-btn ${panicMode ? 'active-panic' : ''}`}
            onClick={togglePanicMode}
            title="Trigger Emergency Situation & Mayday 10-Turn ATC Dialogue"
          >
            {panicMode ? '🚨 PANIC: ON' : '🚨 PANIC'}
          </button>
        </div>

        <div className="speed-selector-group">
          <span className="speed-label">SPEED:</span>
          {[1, 4, 8].map((s) => (
            <button
              key={s}
              className={`speed-btn ${simSpeed === s ? 'active' : ''}`}
              onClick={() => setSimSpeed(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Flight Route Leg Progress Bar & Real-World Distance */}
      <div className="route-progress-card">
        <div className="route-header">
          <div className="route-leg">
            <Navigation size={12} />
            <span>ROUTE: {origin} ➔ {destination}</span>
            {nextRoute && (
              <button
                className="route-change-btn"
                onClick={nextRoute}
                title="Cycle Random Real-World Global Route"
              >
                🔀 CHANGE
              </button>
            )}
          </div>
          <div className="route-timing">
            <span className="route-dist">{remainingNm.toFixed(1)} NM / {totalNm.toFixed(1)} NM</span>
            <span className="route-ete">⏳ {eteFormatted} ETE</span>
          </div>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }}></div>
        </div>
        <div className="route-footer">
          <span>LEG: {progressPct.toFixed(2)}% COMPLETE</span>
          <span>PHASE: <strong className="text-green">{preset}</strong></span>
        </div>
      </div>

      {/* Active Alert Banners (Random Maneuver Event / TCAS Warning) */}
      {activeEvent && (
        <div className="dashboard-alert-banner event-banner">
          <Zap size={14} className="alert-icon" />
          <div className="alert-copy">
            <div className="alert-title">{activeEvent.title}</div>
            <div className="alert-desc">{activeEvent.description}</div>
          </div>
        </div>
      )}

      {tcasAlert && (
        <div className={`dashboard-alert-banner tcas-banner ${tcasAlert.level === 'RA' ? 'ra-alert' : 'ta-alert'}`}>
          <AlertTriangle size={14} className="alert-icon" />
          <div className="alert-copy">
            <div className="alert-title">
              {tcasAlert.level === 'RA' ? '⚠️ TCAS RESOLUTION ADVISORY' : '⚡ TCAS TRAFFIC ADVISORY'}
            </div>
            <div className="alert-desc">PROXIMITY WARNING WITH {tcasAlert.callsign}</div>
          </div>
        </div>
      )}

      {/* Main Panel Content Grid */}
      <div className="dashboard-content">
        {/* 1. Classic 6-Pack Instrument Dials */}
        <AnalogSixPack telemetry={telemetry} uiTheme={uiTheme} />

        {/* 2. Vintage CRT Analog Radar Scope + EICAS Engine / Target Detail */}
        <div className="dashboard-middle-row">
          <AnalogRadarScope
            targets={radarTargets}
            weatherCells={weatherCells}
            heading={heading}
            ownAltitude={altitude}
            rangeNM={radarRangeNM}
            mode={radarMode}
            selectedTarget={selectedTarget}
            onSelectTarget={setSelectedTarget}
            onRangeChange={setRadarRange}
            onModeChange={setRadarMode}
            uiTheme={uiTheme}
          />

          <div className="dashboard-middle-right">
            {/* Selected Target Inspection Card */}
            {selectedTarget ? (
              <div className="inspected-target-card">
                <div className="card-title text-cyan">
                  <Crosshair size={12} />
                  <span>TARGET INSPECTED: {selectedTarget.callsign}</span>
                  <button className="small-close-btn" onClick={() => setSelectedTarget(null)}>×</button>
                </div>
                <div className="target-details-grid">
                  <div className="target-metric">
                    <span className="label">MODEL</span>
                    <span className="val">{selectedTarget.type}</span>
                  </div>
                  <div className="target-metric">
                    <span className="label">DISTANCE</span>
                    <span className="val text-green">{selectedTarget.distance.toFixed(1)} NM</span>
                  </div>
                  <div className="target-metric">
                    <span className="label">BEARING</span>
                    <span className="val">{Math.round(selectedTarget.bearing)}°</span>
                  </div>
                  <div className="target-metric">
                    <span className="label">ALTITUDE</span>
                    <span className="val text-amber">FL{Math.round(selectedTarget.alt / 100)}</span>
                  </div>
                  <div className="target-metric">
                    <span className="label">AIRSPEED</span>
                    <span className="val">{selectedTarget.speed} KTS</span>
                  </div>
                  <div className="target-metric">
                    <span className="label">VSI RATE</span>
                    <span className="val">{selectedTarget.vsi || 0} FPM</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Engine & Cabin Environment Gauges */
              <div className="engine-metrics-card">
                <div className="card-title">
                  <Zap size={13} />
                  <span>EICAS ENGINE & SYSTEMS</span>
                </div>
                <div className="metrics-grid">
                  <div className="metric-item">
                    <span className="metric-label">ENG N1</span>
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
                      {gearDown ? 'DOWN' : 'UP'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Satellite terrain map; manual controls stay available in a compact drawer. */}
        <Suspense fallback={<div className="terrain-flight-section terrain-flight-loading">LOADING TERRAIN FLIGHT MAP…</div>}>
          <TerrainFlightMap telemetry={telemetry} uiTheme={uiTheme} />
        </Suspense>
        <div className="terrain-controls-dock">
          <button
            className={`terrain-controls-toggle ${showFlightControls ? 'active' : ''}`}
            onClick={() => setShowFlightControls((visible) => !visible)}
          >
            <Sliders size={13} />
            <span>{showFlightControls ? 'HIDE SIMULATION CONTROLS' : 'SHOW SIMULATION CONTROLS'}</span>
            <span className="terrain-controls-phase">{preset}</span>
          </button>

          {showFlightControls && (
        <div className="dashboard-controls-section flight-controls-drawer">
          <div className="control-bar-label">
            <Sliders size={13} />
            <span>FLIGHT PHASE PRESETS & MANUAL STICK</span>
          </div>

          <div className="preset-buttons-group">
            {['CRUISE', 'CLIMB', 'DESCENT', 'APPROACH', 'TURBULENCE', 'TAXI', 'TAKEOFF'].map((p) => (
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
          )}
        </div>
      </div>
    </div>
  );
}
