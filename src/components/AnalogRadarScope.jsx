import React, { useEffect, useRef } from 'react';

/**
 * Interactive Vintage CRT Green Flight Radar Scope (PPI) Component
 * Supports TCAS Traffic, WX Weather Cells, Multi-Range Zoom, Leader Lines & Click Selection.
 */
export function AnalogRadarScope({
  targets = [],
  weatherCells = [],
  heading = 0,
  ownAltitude = 35000,
  rangeNM = 40,
  mode = 'TCAS',
  selectedTarget = null,
  onSelectTarget,
  onRangeChange,
  onModeChange,
  uiTheme = 'REALISTIC'
}) {
  const canvasRef = useRef(null);
  const sweepAngleRef = useRef(0);
  const animFrameRef = useRef(null);
  const targetsRef = useRef(targets);

  targetsRef.current = targets;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = 250);
    let height = (canvas.height = 250);
    let centerX = width / 2;
    let centerY = height / 2;
    let radius = Math.min(centerX, centerY) - 14;

    const isPixelTheme = uiTheme === 'PIXEL';

    const render = () => {
      // 1. Draw CRT scope background with trailing phosphor fade
      ctx.fillStyle = isPixelTheme ? 'rgba(0, 15, 0, 0.28)' : 'rgba(2, 10, 5, 0.16)';
      ctx.fillRect(0, 0, width, height);

      // Outer bezel ring
      ctx.strokeStyle = isPixelTheme ? '#00ff66' : '#1b5230';
      ctx.lineWidth = isPixelTheme ? 3 : 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Concentric Range Rings (4 rings based on rangeNM)
      ctx.strokeStyle = isPixelTheme ? 'rgba(0, 255, 102, 0.4)' : 'rgba(0, 255, 102, 0.18)';
      ctx.lineWidth = 1;
      const numRings = 4;
      for (let i = 1; i <= numRings; i++) {
        let r = (radius / numRings) * i;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();

        // Ring distance text
        let ringDist = Math.round((rangeNM / numRings) * i);
        ctx.fillStyle = 'rgba(0, 255, 102, 0.45)';
        ctx.font = '7px "Share Tech Mono", monospace';
        ctx.fillText(`${ringDist}N`, centerX + 3, centerY - r + 8);
      }

      // 3. Crosshair Bearing Lines & Cardinal Markers
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      ctx.fillStyle = isPixelTheme ? '#00ff66' : 'rgba(0, 255, 102, 0.75)';
      ctx.font = isPixelTheme ? '8px "Press Start 2P", monospace' : '9px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', centerX, centerY - radius + 7);
      ctx.fillText('S', centerX, centerY + radius - 7);
      ctx.fillText('E', centerX + radius - 7, centerY);
      ctx.fillText('W', centerX - radius + 7, centerY);

      // 4. WX MODE: Render Meteorological Weather Precipitation Storm Cells
      if (mode === 'WX') {
        weatherCells.forEach((cell) => {
          const normX = (cell.relX / rangeNM) * radius;
          const normY = (cell.relY / rangeNM) * radius;
          const wxX = centerX + normX;
          const wxY = centerY - normY;
          const wxRadius = (cell.radius / rangeNM) * radius;

          const wxGrad = ctx.createRadialGradient(wxX, wxY, 2, wxX, wxY, Math.max(10, wxRadius));
          if (cell.intensity === 'HEAVY') {
            wxGrad.addColorStop(0, 'rgba(255, 0, 85, 0.4)');
            wxGrad.addColorStop(0.5, 'rgba(255, 176, 0, 0.25)');
            wxGrad.addColorStop(1, 'rgba(0, 255, 102, 0)');
          } else if (cell.intensity === 'MODERATE') {
            wxGrad.addColorStop(0, 'rgba(255, 176, 0, 0.35)');
            wxGrad.addColorStop(0.7, 'rgba(0, 255, 102, 0.15)');
            wxGrad.addColorStop(1, 'rgba(0, 255, 102, 0)');
          } else {
            wxGrad.addColorStop(0, 'rgba(0, 255, 102, 0.25)');
            wxGrad.addColorStop(1, 'rgba(0, 255, 102, 0)');
          }

          ctx.fillStyle = wxGrad;
          ctx.beginPath();
          ctx.arc(wxX, wxY, Math.max(10, wxRadius), 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // 5. Radar Sweep Line & Sector
      sweepAngleRef.current = (sweepAngleRef.current + 0.035) % (Math.PI * 2);
      const sweepAngle = sweepAngleRef.current;

      const gradient = ctx.createConicGradient(sweepAngle - 0.45, centerX, centerY);
      gradient.addColorStop(0, 'rgba(0, 255, 102, 0)');
      gradient.addColorStop(0.85, 'rgba(0, 255, 102, 0.05)');
      gradient.addColorStop(1, mode === 'WX' ? 'rgba(0, 229, 255, 0.35)' : 'rgba(0, 255, 102, 0.35)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, sweepAngle - 0.45, sweepAngle);
      ctx.closePath();
      ctx.fill();

      // Bright sweep line
      ctx.strokeStyle = mode === 'WX' ? '#00e5ff' : '#00ff66';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = mode === 'WX' ? '#00e5ff' : '#00ff66';
      ctx.shadowBlur = isPixelTheme ? 0 : 8;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(sweepAngle) * radius, centerY + Math.sin(sweepAngle) * radius);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 6. TCAS TRAFFIC MODE: Render Aircraft Blips, Vectors & Altitude Tags
      targets.forEach((target) => {
        const radB = ((target.bearing - heading - 90) * Math.PI) / 180;
        const normDist = Math.min(target.distance / rangeNM, 0.98);
        const tgtX = centerX + Math.cos(radB) * (radius * normDist);
        const tgtY = centerY + Math.sin(radB) * (radius * normDist);

        const tgtAngle = (Math.atan2(tgtY - centerY, tgtX - centerX) + Math.PI * 2) % (Math.PI * 2);
        const diffAngle = (sweepAngle - tgtAngle + Math.PI * 2) % (Math.PI * 2);

        let intensity = 0.3;
        if (diffAngle < 0.8) {
          intensity = 1.0 - (diffAngle / 0.8) * 0.7;
        }

        const isSelected = selectedTarget && selectedTarget.id === target.id;
        const altDiff100 = Math.round((target.alt - ownAltitude) / 100);
        const relAltStr = (altDiff100 >= 0 ? '+' : '') + altDiff100.toString().padStart(2, '0');
        const trendArrow = target.vsi > 300 ? '↑' : target.vsi < -300 ? '↓' : '';

        // TCAS Threat Color
        let blipColor = `rgba(0, 255, 102, ${intensity})`;
        let alertBorder = false;

        if (target.distance <= 4.0 && Math.abs(altDiff100) <= 8) {
          blipColor = '#ff4757'; // TCAS Resolution Advisory RED
          alertBorder = true;
        } else if (target.distance <= 8.0 && Math.abs(altDiff100) <= 15) {
          blipColor = '#ffb000'; // TCAS Traffic Advisory YELLOW
        }

        if (isSelected) {
          blipColor = '#00e5ff'; // Selected cyan highlight
        }

        // Draw Velocity Leader Line (2 min trend prediction)
        const leaderLen = (target.speed / 500) * 18;
        const leaderRad = ((target.hdg - heading - 90) * Math.PI) / 180;
        ctx.strokeStyle = isSelected ? '#00e5ff' : 'rgba(0, 255, 102, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tgtX, tgtY);
        ctx.lineTo(tgtX + Math.cos(leaderRad) * leaderLen, tgtY + Math.sin(leaderRad) * leaderLen);
        ctx.stroke();

        // Target Selection Ring
        if (isSelected || alertBorder) {
          ctx.strokeStyle = isSelected ? '#00e5ff' : '#ff4757';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(tgtX, tgtY, 8, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw Target Blip Symbol
        ctx.fillStyle = blipColor;
        ctx.beginPath();
        if (isPixelTheme) {
          ctx.fillRect(tgtX - 2.5, tgtY - 2.5, 5, 5);
        } else {
          ctx.arc(tgtX, tgtY, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Target Tag (Callsign + Relative Altitude FL)
        if (mode === 'TCAS' && intensity > 0.25) {
          ctx.fillStyle = isSelected ? '#00e5ff' : `rgba(0, 255, 102, ${intensity * 0.9})`;
          ctx.font = isPixelTheme ? '6px "Press Start 2P", monospace' : '8px "Share Tech Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`${target.callsign} ${relAltStr}${trendArrow}`, tgtX + 6, tgtY - 3);
        }
      });

      // 7. Center Ownship Marker
      ctx.fillStyle = '#00ff66';
      ctx.shadowColor = '#00ff66';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [targets, weatherCells, heading, ownAltitude, rangeNM, mode, selectedTarget, uiTheme]);

  // Click on Canvas to Inspect Aircraft Blip
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !onSelectTarget) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 14;

    let closest = null;
    let minDist = 18; // 18px click radius

    targetsRef.current.forEach((target) => {
      const radB = ((target.bearing - heading - 90) * Math.PI) / 180;
      const normDist = Math.min(target.distance / rangeNM, 0.98);
      const tgtX = centerX + Math.cos(radB) * (radius * normDist);
      const tgtY = centerY + Math.sin(radB) * (radius * normDist);

      const d = Math.hypot(clickX - tgtX, clickY - tgtY);
      if (d < minDist) {
        minDist = d;
        closest = target;
      }
    });

    onSelectTarget(closest);
  };

  return (
    <div className="radar-scope-wrapper">
      {/* Toolbar Controls */}
      <div className="radar-scope-header">
        <div className="radar-mode-selector">
          <button
            className={`mode-btn ${mode === 'TCAS' ? 'active' : ''}`}
            onClick={() => onModeChange && onModeChange('TCAS')}
          >
            TCAS
          </button>
          <button
            className={`mode-btn ${mode === 'WX' ? 'active' : ''}`}
            onClick={() => onModeChange && onModeChange('WX')}
          >
            WX RADAR
          </button>
        </div>

        <div className="radar-range-selector">
          {[10, 20, 40, 80].map((r) => (
            <button
              key={r}
              className={`range-btn ${rangeNM === r ? 'active' : ''}`}
              onClick={() => onRangeChange && onRangeChange(r)}
            >
              {r}NM
            </button>
          ))}
        </div>
      </div>

      <div className="canvas-container" onClick={handleCanvasClick}>
        <canvas ref={canvasRef} width={250} height={250} className="radar-canvas" title="Click blip to inspect aircraft details" />
      </div>
    </div>
  );
}
