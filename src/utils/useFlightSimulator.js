import { useState, useEffect, useRef } from 'react';

/**
 * Real-time Telemetry Flight Simulator Engine Hook
 */
export function useFlightSimulator(active = false) {
  const [telemetry, setTelemetry] = useState({
    pitch: 2.5,          // deg (-30 to +30)
    roll: 0.0,           // deg (-45 to +45)
    heading: 245.0,      // deg (0 to 359)
    altitude: 35000,     // feet (0 to 45000)
    airspeed: 280,       // knots (0 to 450)
    vsi: 0,              // ft/min (-6000 to +6000)
    turnRate: 0.0,       // turn coordinator rate (-1 to 1)
    n1: 86.5,            // % (0 to 104)
    egt: 625,            // °C
    fuelFlow: 2450,      // kg/h
    fuelTotal: 14800,    // kg
    flaps: 0,            // 0, 1, 5, 15, 30, 40
    gearDown: false,
    preset: 'CRUISE',    // 'TAXI' | 'TAKEOFF' | 'CLIMB' | 'CRUISE' | 'DESCENT' | 'APPROACH' | 'TURBULENCE'
    turbulenceLevel: 0,
    radarTargets: [
      { id: 'TGT-1', callsign: 'DAL102', distance: 18.2, bearing: 42, alt: 34000, speed: 450, hdg: 190 },
      { id: 'TGT-2', callsign: 'UAL492', distance: 28.5, bearing: 145, alt: 32000, speed: 430, hdg: 270 },
      { id: 'TGT-3', callsign: 'AAL881', distance: 8.4, bearing: 280, alt: 36000, speed: 470, hdg: 45 },
      { id: 'TGT-4', callsign: 'BAW287', distance: 34.0, bearing: 215, alt: 29000, speed: 410, hdg: 90 }
    ]
  });

  const targetStateRef = useRef({ ...telemetry });
  const animFrameRef = useRef(null);

  // Sync ref when user changes state directly
  useEffect(() => {
    targetStateRef.current = { ...telemetry };
  }, [telemetry.preset]);

  // Main simulation tick loop (running when active)
  useEffect(() => {
    if (!active) return;

    let lastTime = performance.now();

    const updateTick = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.2); // seconds
      lastTime = now;

      setTelemetry((prev) => {
        let { pitch, roll, heading, altitude, airspeed, vsi, turnRate, n1, egt, fuelTotal, preset, radarTargets } = prev;

        // Apply preset dynamics
        let targetPitch = 2.5;
        let targetN1 = 85.0;
        let targetVsi = 0;
        let turbFactor = 0;

        switch (preset) {
          case 'TAXI':
            targetPitch = 0.0;
            targetN1 = 30.0;
            airspeed = Math.max(0, airspeed + (25 - airspeed) * dt * 0.5);
            altitude = 0;
            targetVsi = 0;
            break;
          case 'TAKEOFF':
            targetPitch = 12.0;
            targetN1 = 98.0;
            airspeed = Math.min(180, airspeed + 15 * dt);
            targetVsi = 2200;
            break;
          case 'CLIMB':
            targetPitch = 7.5;
            targetN1 = 92.0;
            airspeed = Math.min(290, airspeed + 5 * dt);
            targetVsi = 1800;
            break;
          case 'CRUISE':
            targetPitch = 2.2;
            targetN1 = 86.5;
            targetVsi = 0;
            turbFactor = 0.3;
            break;
          case 'DESCENT':
            targetPitch = -3.5;
            targetN1 = 65.0;
            targetVsi = -1600;
            break;
          case 'APPROACH':
            targetPitch = 1.0;
            targetN1 = 58.0;
            airspeed = Math.max(140, airspeed - 8 * dt);
            targetVsi = -750;
            break;
          case 'TURBULENCE':
            targetPitch = 2.5;
            targetN1 = 86.5;
            targetVsi = 0;
            turbFactor = 3.5;
            break;
          default:
            break;
        }

        // Smooth pitch transition towards target pitch + turbulence
        const pitchNoise = (Math.sin(now * 0.003) * 0.4 + Math.cos(now * 0.007) * 0.3) * (turbFactor || 0.3);
        pitch += (targetPitch - pitch) * dt * 2.0 + pitchNoise * dt;

        // Smooth roll variation & turbulence
        const rollNoise = (Math.sin(now * 0.002) * 1.2 + Math.cos(now * 0.005) * 1.5) * turbFactor;
        roll += (rollNoise - roll) * dt * 3.0;

        // Heading turn calculation based on roll angle
        turnRate = (roll / 30.0);
        heading = (heading + roll * dt * 0.8 + 360) % 360;

        // VSI and Altitude calculations
        vsi += (targetVsi - vsi) * dt * 2.0;
        altitude = Math.max(0, altitude + (vsi / 60) * dt);

        // Throttle & Engine EGT
        n1 += (targetN1 - n1) * dt * 1.5;
        egt = 450 + (n1 / 100) * 220;

        // Fuel consumption
        const currentFF = 1200 + (n1 / 100) * 1800;
        fuelTotal = Math.max(0, fuelTotal - (currentFF / 3600) * dt);

        // Update Radar Targets (move targets relative to radar scope)
        const updatedTargets = radarTargets.map((tgt) => {
          let { distance, bearing, alt, speed, hdg } = tgt;
          // Target position update relative to ownship
          const radB = (bearing * Math.PI) / 180;
          let x = distance * Math.sin(radB);
          let y = distance * Math.cos(radB);

          // Relative speed vector effect
          const relSpeedKts = (speed - airspeed) * 0.0001 * dt;
          y += relSpeedKts;
          x += Math.sin(hdg * Math.PI / 180) * 0.005 * dt;

          distance = Math.sqrt(x * x + y * y);
          bearing = (Math.atan2(x, y) * 180 / Math.PI + 360) % 360;

          // Keep targets within 5 to 38 NM scope loop
          if (distance > 38) distance = 8 + Math.random() * 5;
          if (distance < 3) distance = 15;

          return { ...tgt, distance, bearing, alt, hdg };
        });

        return {
          ...prev,
          pitch,
          roll,
          heading,
          altitude,
          airspeed,
          vsi,
          turnRate,
          n1,
          egt,
          fuelFlow: Math.round(currentFF),
          fuelTotal: Math.round(fuelTotal),
          radarTargets: updatedTargets
        };
      });

      animFrameRef.current = requestAnimationFrame(updateTick);
    };

    animFrameRef.current = requestAnimationFrame(updateTick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [active]);

  // Helper control methods
  const setPreset = (presetName) => {
    setTelemetry((prev) => ({ ...prev, preset: presetName }));
  };

  const adjustPitch = (delta) => {
    setTelemetry((prev) => ({ ...prev, pitch: Math.max(-30, Math.min(30, prev.pitch + delta)) }));
  };

  const adjustRoll = (delta) => {
    setTelemetry((prev) => ({ ...prev, roll: Math.max(-45, Math.min(45, prev.roll + delta)) }));
  };

  const toggleGear = () => {
    setTelemetry((prev) => ({ ...prev, gearDown: !prev.gearDown }));
  };

  const setFlaps = (flapVal) => {
    setTelemetry((prev) => ({ ...prev, flaps: flapVal }));
  };

  return {
    telemetry,
    setPreset,
    adjustPitch,
    adjustRoll,
    toggleGear,
    setFlaps
  };
}
