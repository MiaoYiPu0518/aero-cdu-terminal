import React, { lazy, Suspense } from 'react';
import { Activity, Navigation, X, Zap } from 'lucide-react';
import { AnalogSixPack } from './AnalogSixPack';

const TerrainFlightMap = lazy(() => import('./TerrainFlightMap').then((module) => ({ default: module.TerrainFlightMap })));

/**
 * Left-side docked virtual flight dashboard container.
 */
export function FlightDashboard({
  telemetry,
  toggleAutoFlight,
  toggleRandomManeuvers,
  togglePanicMode,
  nextRoute,
  setSimSpeed,
  onClose,
  children
}) {
  const {
    n1, egt, fuelFlow, fuelTotal, flaps, gearDown,
    preset, autoFlightMode, randomManeuversEnabled, panicMode, simSpeed,
    origin, destination, distRemainingNM, totalDistNM, legProgressPct,
    eteFormatted, activeEvent
  } = telemetry;

  const progressPct = Number.isFinite(legProgressPct)
    ? Math.min(100, Math.max(0, legProgressPct))
    : 0;
  const remainingNm = Number.isFinite(distRemainingNM) ? distRemainingNM : 0;
  const totalNm = Number.isFinite(totalDistNM) ? totalDistNM : 0;

  return (
    <div className={`flight-dashboard-panel ${panicMode ? 'panic-active' : ''}`}>
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

      <div className="dashboard-toolbar">
        <div className="toolbar-group">
          <button
            className={`toolbar-btn ${autoFlightMode ? 'active-green' : ''}`}
            onClick={toggleAutoFlight}
            title="Toggle automatic flight"
          >
            {autoFlightMode ? '🤖 AUTO FLIGHT: ON' : '🖐️ MANUAL FLIGHT'}
          </button>

          <button
            className={`toolbar-btn ${randomManeuversEnabled ? 'active-amber' : ''}`}
            onClick={toggleRandomManeuvers}
            title="Toggle random tactical maneuvers and events"
          >
            {randomManeuversEnabled ? '🎲 MANEUVERS: ON' : '🎲 MANEUVERS: OFF'}
          </button>

          <button
            className={`toolbar-btn panic-btn ${panicMode ? 'active-panic' : ''}`}
            onClick={togglePanicMode}
            title="Trigger emergency situation and Mayday ATC dialogue"
          >
            {panicMode ? '🚨 PANIC: ON' : '🚨 PANIC'}
          </button>
        </div>

        <div className="speed-selector-group">
          <span className="speed-label">SPEED:</span>
          {[1, 4, 8].map((speed) => (
            <button
              key={speed}
              className={`speed-btn ${simSpeed === speed ? 'active' : ''}`}
              onClick={() => setSimSpeed(speed)}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      <div className="route-progress-card">
        <div className="route-header">
          <div className="route-leg">
            <Navigation size={12} />
            <span>ROUTE: {origin} ➔ {destination}</span>
            <button className="route-change-btn" onClick={nextRoute} title="Cycle random real-world route">
              🔀 CHANGE
            </button>
          </div>
          <div className="route-timing">
            <span className="route-dist">{remainingNm.toFixed(1)} NM / {totalNm.toFixed(1)} NM</span>
            <span className="route-ete">⏳ {eteFormatted} ETE</span>
          </div>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="route-footer">
          <span>LEG: {progressPct.toFixed(2)}% COMPLETE</span>
          <span>PHASE: <strong className="text-green">{preset}</strong></span>
        </div>
      </div>

      {activeEvent && (
        <div className="dashboard-alert-banner event-banner">
          <Zap size={14} className="alert-icon" />
          <div className="alert-copy">
            <div className="alert-title">{activeEvent.title}</div>
            <div className="alert-desc">{activeEvent.description}</div>
          </div>
        </div>
      )}

      <div className="dashboard-body">
        <div className="dashboard-content">
          <AnalogSixPack telemetry={telemetry} />

          <div className="dashboard-middle-row">
            <Suspense fallback={<div className="terrain-flight-section terrain-flight-loading">LOADING TERRAIN FLIGHT MAP…</div>}>
              <TerrainFlightMap telemetry={telemetry} />
            </Suspense>

            <div className="dashboard-middle-right">
              <div className="engine-metrics-card">
                <div className="card-title">
                  <Zap size={13} />
                  <span>EICAS ENGINE &amp; SYSTEMS</span>
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
            </div>
          </div>
        </div>

        {children && (
          <div className="dashboard-cdu-module">
            <div className="dashboard-module-label">INTEGRATED CDU</div>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
