import React from 'react';

/**
 * Classic 6-Pack Analog Flight Instruments Cluster (Pure SVG Implementation)
 */
export function AnalogSixPack({ telemetry, uiTheme = 'REALISTIC' }) {
  const {
    pitch = 0,
    roll = 0,
    heading = 0,
    altitude = 0,
    airspeed = 0,
    vsi = 0,
    turnRate = 0
  } = telemetry;

  const isPixel = uiTheme === 'PIXEL';

  // Calculations for instrument rotations & positions
  // 1. Airspeed Needle Angle (0 to 400 kts -> 0 to 320 degrees)
  const airspeedAngle = Math.min(360, (airspeed / 400) * 320);

  // 2. Altimeter Needles
  const alt1000Angle = ((altitude % 1000) / 1000) * 360;
  const alt10000Angle = ((altitude % 10000) / 10000) * 360;

  // 3. VSI Needle Angle (-6000 to +6000 ft/min -> -160 to +160 degrees)
  const vsiAngle = Math.max(-160, Math.min(160, (vsi / 6000) * 160));

  // 4. Heading Dial Rotation
  const headingAngle = -heading;

  // 5. Attitude Horizon Translation & Rotation
  const horizonY = Math.max(-45, Math.min(45, pitch * 1.8)); // 1.8px per degree

  // 6. Turn Coordinator Roll & Ball Offset
  const tcAircraftRoll = turnRate * 25; // max ±25 deg
  const tcBallX = Math.max(-18, Math.min(18, turnRate * 18));

  return (
    <div className="six-pack-container">
      {/* 1. AIRSPEED INDICATOR */}
      <div className="analog-gauge-box">
        <span className="gauge-label">AIRSPEED (KTS)</span>
        <svg viewBox="0 0 160 160" className="gauge-svg">
          {/* Bezel Ring */}
          <circle cx="80" cy="80" r="76" fill="#12151a" stroke={isPixel ? '#00ff66' : '#2d3542'} strokeWidth="4" />
          <circle cx="80" cy="80" r="71" fill="#080a0d" />

          {/* Speed Ticks & Numbers */}
          <g className="gauge-ticks" stroke="#8a99ad" strokeWidth="1.5">
            {[0, 40, 80, 120, 160, 200, 240, 280, 320, 360].map((spd, i) => {
              const ang = ((spd / 400) * 320 - 90) * (Math.PI / 180);
              const x1 = 80 + Math.cos(ang) * 58;
              const y1 = 80 + Math.sin(ang) * 58;
              const x2 = 80 + Math.cos(ang) * 68;
              const y2 = 80 + Math.sin(ang) * 68;
              const tx = 80 + Math.cos(ang) * 46;
              const ty = 80 + Math.sin(ang) * 46;
              return (
                <g key={spd}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} />
                  <text x={tx} y={ty + 3} fill="#c8d6e5" fontSize="9" textAnchor="middle" fontFamily="Share Tech Mono">
                    {spd}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Digital Airspeed Readout */}
          <rect x="52" y="105" width="56" height="18" fill="#171b21" rx="3" stroke="#2d3542" />
          <text x="80" y="118" fill="#00ff66" fontSize="12" textAnchor="middle" fontWeight="bold" fontFamily="Share Tech Mono">
            {Math.round(airspeed)} KT
          </text>

          {/* Needle */}
          <g transform={`rotate(${airspeedAngle - 90} 80 80)`}>
            <polygon points="80,80 77,20 80,12 83,20" fill="#ffb000" />
            <circle cx="80" cy="80" r="6" fill="#242b35" stroke="#ffb000" strokeWidth="2" />
          </g>
        </svg>
      </div>

      {/* 2. ATTITUDE INDICATOR (ARTIFICIAL HORIZON) */}
      <div className="analog-gauge-box">
        <span className="gauge-label">ATTITUDE (HORIZON)</span>
        <svg viewBox="0 0 160 160" className="gauge-svg">
          <defs>
            <clipPath id="horizon-clip">
              <circle cx="80" cy="80" r="70" />
            </clipPath>
          </defs>

          {/* Bezel */}
          <circle cx="80" cy="80" r="76" fill="#12151a" stroke={isPixel ? '#00ff66' : '#2d3542'} strokeWidth="4" />

          {/* Rotating & Translating Horizon Sphere */}
          <g clipPath="url(#horizon-clip)">
            <g transform={`rotate(${-roll} 80 80) translate(0, ${horizonY})`}>
              {/* Sky (Blue) */}
              <rect x="-40" y="-120" width="240" height="200" fill="#1e4f8a" />
              {/* Ground (Brown) */}
              <rect x="-40" y="80" width="240" height="200" fill="#7a4218" />
              {/* Horizon Line */}
              <line x1="-40" y1="80" x2="200" y2="80" stroke="#ffffff" strokeWidth="2.5" />

              {/* Pitch Ladder Lines */}
              {[-30, -20, -10, 10, 20, 30].map((deg) => {
                const py = 80 - deg * 1.8;
                const width = Math.abs(deg) % 20 === 0 ? 36 : 22;
                return (
                  <g key={deg}>
                    <line x1={80 - width / 2} y1={py} x2={80 + width / 2} y2={py} stroke="#ffffff" strokeWidth="1.5" />
                    <text x={80 - width / 2 - 8} y={py + 3} fill="#ffffff" fontSize="8" textAnchor="end" fontFamily="Share Tech Mono">
                      {Math.abs(deg)}
                    </text>
                  </g>
                );
              })}
            </g>
          </g>

          {/* Roll Pointer & Arc Scale */}
          <g transform={`rotate(${-roll} 80 80)`}>
            <polygon points="80,14 76,22 84,22" fill="#ffb000" />
          </g>

          {/* Stationary Airplane Reference Symbol (Yellow Crossbar) */}
          <path d="M 40,80 L 68,80 L 74,90 L 86,90 L 92,80 L 120,80" stroke="#ffb000" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="80" cy="80" r="3" fill="#ffb000" />
        </svg>
      </div>

      {/* 3. ALTIMETER */}
      <div className="analog-gauge-box">
        <span className="gauge-label">ALTIMETER (FEET)</span>
        <svg viewBox="0 0 160 160" className="gauge-svg">
          <circle cx="80" cy="80" r="76" fill="#12151a" stroke={isPixel ? '#00ff66' : '#2d3542'} strokeWidth="4" />
          <circle cx="80" cy="80" r="71" fill="#080a0d" />

          {/* Dial Numbers 0-9 */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
            const ang = (num * 36 - 90) * (Math.PI / 180);
            const tx = 80 + Math.cos(ang) * 50;
            const ty = 80 + Math.sin(ang) * 50;
            const x1 = 80 + Math.cos(ang) * 60;
            const y1 = 80 + Math.sin(ang) * 60;
            const x2 = 80 + Math.cos(ang) * 68;
            const y2 = 80 + Math.sin(ang) * 68;
            return (
              <g key={num}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8a99ad" strokeWidth="2" />
                <text x={tx} y={ty + 4} fill="#c8d6e5" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="Share Tech Mono">
                  {num}
                </text>
              </g>
            );
          })}

          {/* Digital Altitude Drum Window */}
          <rect x="44" y="50" width="72" height="18" fill="#171b21" rx="3" stroke="#2d3542" />
          <text x="80" y="63" fill="#00ff66" fontSize="11" textAnchor="middle" fontWeight="bold" fontFamily="Share Tech Mono">
            {Math.round(altitude).toString().padStart(5, '0')} FT
          </text>

          {/* 10,000 ft Needle (Long thin) */}
          <g transform={`rotate(${alt10000Angle - 90} 80 80)`}>
            <line x1="80" y1="80" x2="80" y2="18" stroke="#ff4757" strokeWidth="2" />
          </g>

          {/* 1,000 ft Needle (Thick) */}
          <g transform={`rotate(${alt1000Angle - 90} 80 80)`}>
            <polygon points="80,80 76,28 80,18 84,28" fill="#ffffff" />
            <circle cx="80" cy="80" r="6" fill="#242b35" stroke="#ffffff" strokeWidth="2" />
          </g>
        </svg>
      </div>

      {/* 4. TURN COORDINATOR */}
      <div className="analog-gauge-box">
        <span className="gauge-label">TURN COORDINATOR</span>
        <svg viewBox="0 0 160 160" className="gauge-svg">
          <circle cx="80" cy="80" r="76" fill="#12151a" stroke={isPixel ? '#00ff66' : '#2d3542'} strokeWidth="4" />
          <circle cx="80" cy="80" r="71" fill="#080a0d" />

          {/* 2 MIN Turn Marks */}
          <rect x="25" y="76" width="12" height="8" fill="#ffffff" />
          <rect x="123" y="76" width="12" height="8" fill="#ffffff" />
          <text x="80" y="36" fill="#8a99ad" fontSize="9" textAnchor="middle" fontFamily="Share Tech Mono">
            2 MIN TURN
          </text>

          {/* Tilting Aircraft Silhouette */}
          <g transform={`rotate(${tcAircraftRoll} 80 75)`}>
            <path d="M 40,75 L 120,75 M 80,55 L 80,85 M 70,85 L 90,85" stroke="#ffb000" strokeWidth="4" strokeLinecap="round" />
            <circle cx="80" cy="75" r="4" fill="#ffb000" />
          </g>

          {/* Inclinometer Curved Tube & Slip Ball */}
          <path d="M 45,120 Q 80,132 115,120" stroke="#2d3542" strokeWidth="14" fill="none" strokeLinecap="round" />
          <path d="M 45,120 Q 80,132 115,120" stroke="#12151a" strokeWidth="10" fill="none" strokeLinecap="round" />
          {/* Slip Ball */}
          <circle cx={80 + tcBallX} cy={125 - Math.abs(tcBallX) * 0.1} r="5" fill="#c8d6e5" stroke="#ffffff" strokeWidth="1" />
        </svg>
      </div>

      {/* 5. HEADING INDICATOR (COMPASS) */}
      <div className="analog-gauge-box">
        <span className="gauge-label">HEADING (COMPASS)</span>
        <svg viewBox="0 0 160 160" className="gauge-svg">
          <circle cx="80" cy="80" r="76" fill="#12151a" stroke={isPixel ? '#00ff66' : '#2d3542'} strokeWidth="4" />
          <circle cx="80" cy="80" r="71" fill="#080a0d" />

          {/* Rotating Compass Ring */}
          <g transform={`rotate(${headingAngle} 80 80)`}>
            {['N', 3, 6, 'E', 12, 15, 'S', 21, 24, 'W', 30, 33].map((card, i) => {
              const ang = (i * 30 - 90) * (Math.PI / 180);
              const tx = 80 + Math.cos(ang) * 50;
              const ty = 80 + Math.sin(ang) * 50;
              const x1 = 80 + Math.cos(ang) * 60;
              const y1 = 80 + Math.sin(ang) * 60;
              const x2 = 80 + Math.cos(ang) * 68;
              const y2 = 80 + Math.sin(ang) * 68;
              const isCardinal = typeof card === 'string';
              return (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isCardinal ? '#ffb000' : '#8a99ad'} strokeWidth="2" />
                  <text
                    x={tx}
                    y={ty + 4}
                    fill={isCardinal ? '#ffb000' : '#c8d6e5'}
                    fontSize={isCardinal ? '13' : '11'}
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="Share Tech Mono"
                  >
                    {card}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Stationary Lubber Line & Fixed Aircraft Symbol */}
          <polygon points="80,12 76,22 84,22" fill="#ff4757" />
          <path d="M 80,55 L 80,105 M 60,75 L 100,75 M 70,100 L 90,100" stroke="#00ff66" strokeWidth="2.5" />
          <circle cx="80" cy="80" r="3" fill="#00ff66" />
        </svg>
      </div>

      {/* 6. VERTICAL SPEED INDICATOR (VSI) */}
      <div className="analog-gauge-box">
        <span className="gauge-label">VERTICAL SPEED (VSI)</span>
        <svg viewBox="0 0 160 160" className="gauge-svg">
          <circle cx="80" cy="80" r="76" fill="#12151a" stroke={isPixel ? '#00ff66' : '#2d3542'} strokeWidth="4" />
          <circle cx="80" cy="80" r="71" fill="#080a0d" />

          {/* VSI Scale Marks (-6 to +6 x1000 FPM) */}
          {[-6, -4, -2, 0, 2, 4, 6].map((val) => {
            const ang = ((val / 6) * 160 - 90) * (Math.PI / 180);
            const tx = 80 + Math.cos(ang) * 48;
            const ty = 80 + Math.sin(ang) * 48;
            const x1 = 80 + Math.cos(ang) * 58;
            const y1 = 80 + Math.sin(ang) * 58;
            const x2 = 80 + Math.cos(ang) * 68;
            const y2 = 80 + Math.sin(ang) * 68;
            return (
              <g key={val}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8a99ad" strokeWidth="2" />
                <text x={tx} y={ty + 4} fill="#c8d6e5" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="Share Tech Mono">
                  {Math.abs(val)}
                </text>
              </g>
            );
          })}
          <text x="80" y="115" fill="#8a99ad" fontSize="8" textAnchor="middle" fontFamily="Share Tech Mono">
            UP / DN 1000 FPM
          </text>

          {/* VSI Needle */}
          <g transform={`rotate(${vsiAngle - 90} 80 80)`}>
            <polygon points="80,80 76,20 80,12 84,20" fill="#00e5ff" />
            <circle cx="80" cy="80" r="6" fill="#242b35" stroke="#00e5ff" strokeWidth="2" />
          </g>
        </svg>
      </div>
    </div>
  );
}
