import React, { useEffect, useRef } from 'react';

/**
 * Vintage CRT Green Analog Flight Radar Scope (PPI) Component
 */
export function AnalogRadarScope({ targets = [], heading = 0, uiTheme = 'REALISTIC' }) {
  const canvasRef = useRef(null);
  const sweepAngleRef = useRef(0);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = 240);
    let height = (canvas.height = 240);
    let centerX = width / 2;
    let centerY = height / 2;
    let radius = Math.min(centerX, centerY) - 12;

    const isPixelTheme = uiTheme === 'PIXEL';

    const render = () => {
      // 1. Draw CRT background with trailing phosphor fade
      ctx.fillStyle = isPixelTheme ? 'rgba(0, 20, 0, 0.25)' : 'rgba(2, 12, 6, 0.15)';
      ctx.fillRect(0, 0, width, height);

      // Outer bezel ring
      ctx.strokeStyle = isPixelTheme ? '#00ff66' : '#1b4d2e';
      ctx.lineWidth = isPixelTheme ? 3 : 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Concentric Range Rings (10NM, 20NM, 30NM, 40NM)
      ctx.strokeStyle = isPixelTheme ? 'rgba(0, 255, 102, 0.4)' : 'rgba(0, 255, 102, 0.18)';
      ctx.lineWidth = 1;
      const numRings = 4;
      for (let i = 1; i <= numRings; i++) {
        let r = (radius / numRings) * i;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 3. Crosshair Bearing Lines (N-S, E-W)
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      // 4. Cardinal Labels (N, E, S, W)
      ctx.fillStyle = isPixelTheme ? '#00ff66' : 'rgba(0, 255, 102, 0.7)';
      ctx.font = isPixelTheme ? '9px "Press Start 2P", monospace' : '9px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', centerX, centerY - radius + 7);
      ctx.fillText('S', centerX, centerY + radius - 7);
      ctx.fillText('E', centerX + radius - 7, centerY);
      ctx.fillText('W', centerX - radius + 7, centerY);

      // 5. Radar Sweep Line & Phosphor Beam Sector
      sweepAngleRef.current = (sweepAngleRef.current + 0.03) % (Math.PI * 2);
      const sweepAngle = sweepAngleRef.current;

      // Draw sweeping sector gradient
      const gradient = ctx.createConicGradient(sweepAngle - 0.4, centerX, centerY);
      gradient.addColorStop(0, 'rgba(0, 255, 102, 0)');
      gradient.addColorStop(0.85, 'rgba(0, 255, 102, 0.05)');
      gradient.addColorStop(1, 'rgba(0, 255, 102, 0.35)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, sweepAngle - 0.4, sweepAngle);
      ctx.closePath();
      ctx.fill();

      // Bright sweep front line
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00ff66';
      ctx.shadowBlur = isPixelTheme ? 0 : 8;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(sweepAngle) * radius, centerY + Math.sin(sweepAngle) * radius);
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow

      // 6. Draw Aircraft Target Blips
      const maxDistNM = 40;
      targets.forEach((target) => {
        // Convert polar (bearing, distance) to Cartesian canvas (x, y)
        const radB = ((target.bearing - heading - 90) * Math.PI) / 180;
        const normDist = Math.min(target.distance / maxDistNM, 0.95);
        const tgtX = centerX + Math.cos(radB) * (radius * normDist);
        const tgtY = centerY + Math.sin(radB) * (radius * normDist);

        // Angular distance between sweep line and target angle
        const tgtAngle = (Math.atan2(tgtY - centerY, tgtX - centerX) + Math.PI * 2) % (Math.PI * 2);
        const diffAngle = (sweepAngle - tgtAngle + Math.PI * 2) % (Math.PI * 2);

        // Intensity based on how recently the sweep passed the target
        let intensity = 0.2;
        if (diffAngle < 0.8) {
          intensity = 1.0 - diffAngle / 0.8 * 0.8;
        }

        // Draw blip dot
        ctx.fillStyle = `rgba(0, 255, 102, ${Math.max(0.2, intensity)})`;
        ctx.shadowColor = '#00ff66';
        ctx.shadowBlur = intensity > 0.6 ? 6 : 0;

        ctx.beginPath();
        if (isPixelTheme) {
          ctx.fillRect(tgtX - 2, tgtY - 2, 4, 4);
        } else {
          ctx.arc(tgtX, tgtY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Callsign Label next to blip
        if (intensity > 0.3) {
          ctx.fillStyle = `rgba(0, 255, 102, ${intensity * 0.85})`;
          ctx.font = isPixelTheme ? '7px "Press Start 2P", monospace' : '8px "Share Tech Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`${target.callsign} FL${Math.round(target.alt / 100)}`, tgtX + 5, tgtY - 3);
        }
      });

      // 7. Center Ownship Marker
      ctx.fillStyle = '#00ff66';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fill();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [targets, heading, uiTheme]);

  return (
    <div className="radar-scope-wrapper">
      <div className="radar-scope-header">
        <span className="radar-title">CRT RADAR SCOPE</span>
        <span className="radar-mode">RANGE: 40NM</span>
      </div>
      <div className="canvas-container">
        <canvas ref={canvasRef} width={240} height={240} className="radar-canvas" />
      </div>
    </div>
  );
}
