import { useState, useEffect, useRef } from 'react';
import { soundEngine } from './soundEngine';

/**
 * Advanced Telemetry Flight Simulator Engine Hook
 * Includes Auto-Flight Lifecycle State Machine, Random Tactical Maneuvers,
 * Weather Storm Cells, and TCAS Proximity Alerts.
 */
export function useFlightSimulator(active = false) {
  const [telemetry, setTelemetry] = useState({
    // Primary Flight Instruments Data
    pitch: 0.0,          // deg (-30 to +30)
    roll: 0.0,           // deg (-45 to +45)
    heading: 245.0,      // deg (0 to 359)
    altitude: 0,         // feet (0 to 45000)
    airspeed: 0,         // knots (0 to 450)
    vsi: 0,              // ft/min (-6000 to +6000)
    turnRate: 0.0,       // turn coordinator rate (-1 to 1)

    // Engine & Aircraft Configuration
    n1: 30.0,            // % (0 to 104)
    egt: 450,            // °C
    fuelFlow: 1200,      // kg/h
    fuelTotal: 16500,    // kg
    flaps: 0,            // 0, 1, 5, 15, 30, 40
    gearDown: true,

    // Flight Lifecycle & Auto Flight Controls
    preset: 'TAXI',      // 'TAXI' | 'TAKEOFF' | 'CLIMB' | 'CRUISE' | 'DESCENT' | 'APPROACH' | 'TOUCHDOWN'
    autoFlightMode: true,
    randomManeuversEnabled: true,
    panicMode: false,
    simSpeed: 4,         // 1x, 4x, 8x speed multiplier

    // Route & Progress Tracking
    origin: 'KJFK',
    destination: 'EGLL',
    distRemainingNM: 420,
    totalDistNM: 420,
    legProgressPct: 0,
    targetAlt: 35000,
    targetSpeed: 440,

    // Active Maneuver / Event Status
    activeEvent: null,   // null | { type, title, description, duration }
    tcasAlert: null,     // null | { level: 'TA' | 'RA', callsign }

    // Radar Data Engine
    radarRangeNM: 40,
    radarMode: 'TCAS',   // 'TCAS' | 'WX'
    selectedTarget: null,
    weatherCells: [
      { id: 'WX-1', relX: 12, relY: 18, radius: 14, intensity: 'HEAVY' },   // Red/Yellow storm cell
      { id: 'WX-2', relX: -22, relY: -10, radius: 18, intensity: 'MODERATE' },// Yellow storm cell
      { id: 'WX-3', relX: 5, relY: -28, radius: 10, intensity: 'LIGHT' }     // Green rain cell
    ],
    radarTargets: [
      { id: 'TGT-1', callsign: 'DAL102', type: 'B738', distance: 14.2, bearing: 42,  alt: 35400, speed: 450, hdg: 190, vsi: 0 },
      { id: 'TGT-2', callsign: 'UAL492', type: 'A320', distance: 28.5, bearing: 145, alt: 33800, speed: 430, hdg: 270, vsi: -500 },
      { id: 'TGT-3', callsign: 'AAL881', type: 'B777', distance: 8.4,  bearing: 280, alt: 35000, speed: 470, hdg: 45,  vsi: 1200 },
      { id: 'TGT-4', callsign: 'BAW287', type: 'A350', distance: 34.0, bearing: 215, alt: 29000, speed: 410, hdg: 90,  vsi: 0 },
      { id: 'TGT-5', callsign: 'AFR012', type: 'A330', distance: 18.0, bearing: 330, alt: 36200, speed: 460, hdg: 130, vsi: 0 }
    ]
  });

  const maneuverTimerRef = useRef(0);
  const phaseTimerRef = useRef(0);
  const animFrameRef = useRef(null);

  // Main Simulation Loop
  useEffect(() => {
    if (!active) return;

    let lastTime = performance.now();

    const updateTick = (now) => {
      const realDt = Math.min((now - lastTime) / 1000, 0.2);
      lastTime = now;

      setTelemetry((prev) => {
        let {
          pitch, roll, heading, altitude, airspeed, vsi, turnRate, n1, egt, fuelTotal,
          preset, autoFlightMode, randomManeuversEnabled, panicMode, simSpeed, distRemainingNM, totalDistNM,
          activeEvent, tcasAlert, weatherCells, radarTargets, flaps, gearDown, selectedTarget
        } = prev;

        const dt = realDt * simSpeed;
        maneuverTimerRef.current += dt;
        phaseTimerRef.current += dt;

        // Emergency PANIC Mode Override
        if (panicMode) {
          n1 = 18.0;
          egt = 780;
          airspeed = Math.max(210, airspeed - 5 * dt);

          // Fast descent until reaching 10,000 ft floor, then bounce up & down with severe turbulence
          if (altitude > 10800) {
            vsi = -4500;
            pitch = -7.5 + (Math.sin(now * 0.008) * 3.0);
            roll = Math.sin(now * 0.005) * 8.0;
            altitude = Math.max(10000, altitude + (vsi / 60) * dt);
          } else {
            // Oscillate / bounce altitude up & down continuously around 10,000 ft
            const bounceOffset = Math.sin(now * 0.003) * 650 + Math.cos(now * 0.007) * 350;
            altitude = Math.max(1000, 10000 + bounceOffset);
            vsi = Math.cos(now * 0.003) * 1800 + Math.sin(now * 0.007) * 1200;
            pitch = -2.5 + (Math.sin(now * 0.006) * 5.0);
            roll = Math.sin(now * 0.004) * 12.0;
          }

          activeEvent = {
            type: 'PANIC_MAYDAY',
            title: '🚨 EMERGENCY MAYDAY (SQUAWK 7700)',
            description: 'ENGINE 1 SEVERE VIBRATION & FAILURE - EMERGENCY DESCENT & BOUNCING 10,000 FT'
          };
        } else {
          // If panic was just turned off, clear panic event notification cleanly
          if (activeEvent && activeEvent.type === 'PANIC_MAYDAY') {
            activeEvent = null;
          }
          if (autoFlightMode) {
          switch (preset) {
            case 'TAXI':
              pitch = 0;
              n1 = 32;
              airspeed = Math.min(25, airspeed + 4 * dt);
              altitude = 0;
              vsi = 0;
              gearDown = true;
              flaps = 0;
              if (phaseTimerRef.current > 8) {
                preset = 'TAKEOFF';
                phaseTimerRef.current = 0;
              }
              break;

            case 'TAKEOFF':
              n1 = 98;
              gearDown = true;
              flaps = 15;
              if (airspeed < 150) {
                airspeed += 18 * dt;
                pitch = 0;
                vsi = 0;
              } else {
                // Rotation & initial climb
                pitch = Math.min(13.5, pitch + 4 * dt);
                vsi = 2200;
                airspeed = Math.min(185, airspeed + 5 * dt);
                altitude += (vsi / 60) * dt;
                if (altitude > 1000) {
                  gearDown = false;
                  flaps = 5;
                  preset = 'CLIMB';
                  phaseTimerRef.current = 0;
                  soundEngine.playGearClunk();
                }
              }
              break;

            case 'CLIMB':
              pitch = 7.5;
              n1 = 92;
              vsi = 2200;
              gearDown = false;
              flaps = 0;
              airspeed = Math.min(290, airspeed + 4 * dt);
              altitude = Math.min(35000, altitude + (vsi / 60) * dt);
              if (altitude >= 35000) {
                preset = 'CRUISE';
                vsi = 0;
                pitch = 2.2;
                phaseTimerRef.current = 0;
                soundEngine.playAltitudeChime();
              }
              break;

            case 'CRUISE':
              gearDown = false;
              flaps = 0;
              n1 = 86.5;
              airspeed = Math.min(440, airspeed + 2 * dt);
              altitude = 35000;
              vsi = 0;

              // Distance progress towards destination
              distRemainingNM = Math.max(0, distRemainingNM - (airspeed / 3600) * dt * 4);
              if (distRemainingNM <= 60) {
                preset = 'DESCENT';
                phaseTimerRef.current = 0;
                soundEngine.playMasterCaution();
              }
              break;

            case 'DESCENT':
              n1 = 62;
              pitch = -3.5;
              vsi = -1800;
              airspeed = Math.max(220, airspeed - 6 * dt);
              altitude = Math.max(3500, altitude + (vsi / 60) * dt);
              distRemainingNM = Math.max(0, distRemainingNM - (airspeed / 3600) * dt * 4);
              if (altitude <= 4000) {
                preset = 'APPROACH';
                phaseTimerRef.current = 0;
                soundEngine.playGearClunk();
              }
              break;

            case 'APPROACH':
              n1 = 55;
              gearDown = true;
              flaps = 30;
              pitch = 1.2;
              vsi = -750;
              airspeed = Math.max(140, airspeed - 8 * dt);
              altitude = Math.max(0, altitude + (vsi / 60) * dt);
              distRemainingNM = Math.max(0, distRemainingNM - (airspeed / 3600) * dt * 2);
              if (altitude <= 20) {
                preset = 'TOUCHDOWN';
                phaseTimerRef.current = 0;
                soundEngine.playTouchdownChirp();
              }
              break;

            case 'TOUCHDOWN':
              n1 = 30;
              pitch = Math.max(0, pitch - 2 * dt);
              vsi = 0;
              altitude = 0;
              airspeed = Math.max(0, airspeed - 25 * dt);
              if (airspeed <= 5) {
                // Loop back to taxi after flight completed
                preset = 'TAXI';
                distRemainingNM = totalDistNM;
                phaseTimerRef.current = 0;
              }
              break;
            default:
              break;
          }
        }
      }

        // 2. RANDOM TACTICAL MANEUVERS ENGINE (Runs in Cruise / Climb / Descent)
        if (randomManeuversEnabled && autoFlightMode && (preset === 'CRUISE' || preset === 'CLIMB' || preset === 'DESCENT')) {
          if (!activeEvent && maneuverTimerRef.current > 18) {
            maneuverTimerRef.current = 0;
            const randType = Math.random();
            if (randType < 0.35) {
              activeEvent = {
                type: 'WEATHER_DEVIATION',
                title: '🔀 WEATHER DEVIATION',
                description: 'BANKING 25° LEFT TO AVOID CONVECTIVE STORM CELL',
                duration: 12,
                timer: 0
              };
              soundEngine.playMasterCaution();
            } else if (randType < 0.65) {
              activeEvent = {
                type: 'ATC_STEP_CLIMB',
                title: '📈 ATC STEP CLIMB DIRECTIVE',
                description: 'CLIMBING FL350 -> FL370 FOR TRAFFIC SEPARATION',
                duration: 15,
                timer: 0
              };
              soundEngine.playAltitudeChime();
            } else {
              activeEvent = {
                type: 'TCAS_AVOIDANCE',
                title: '⚠️ TCAS RESOLUTION ADVISORY',
                description: 'TRAFFIC AVOIDANCE MANEUVER: CLIMBING +2500 FPM',
                duration: 8,
                timer: 0
              };
              soundEngine.playTCASWarning();
            }
          }
        }

        // Process Active Event Effect
        if (activeEvent) {
          activeEvent.timer += dt;
          if (activeEvent.type === 'WEATHER_DEVIATION') {
            roll += (-22 - roll) * dt * 2.0;
          } else if (activeEvent.type === 'ATC_STEP_CLIMB') {
            pitch += (5.0 - pitch) * dt * 2.0;
            vsi += (1600 - vsi) * dt * 2.0;
            altitude += (vsi / 60) * dt;
          } else if (activeEvent.type === 'TCAS_AVOIDANCE') {
            pitch += (8.0 - pitch) * dt * 3.0;
            vsi += (2500 - vsi) * dt * 3.0;
            altitude += (vsi / 60) * dt;
          }

          if (activeEvent.timer >= activeEvent.duration) {
            activeEvent = null;
          }
        } else {
          // Return to normal roll & pitch stability
          const turb = preset === 'TURBULENCE' ? 3.0 : 0.4;
          const pitchNoise = (Math.sin(now * 0.003) * 0.3 + Math.cos(now * 0.007) * 0.2) * turb;
          const rollNoise = (Math.sin(now * 0.002) * 0.8 + Math.cos(now * 0.005) * 1.0) * turb;

          pitch += (2.2 - pitch) * dt * 1.5 + pitchNoise * dt;
          roll += (rollNoise - roll) * dt * 2.5;
        }

        // Turn rate & Heading Update
        turnRate = roll / 30.0;
        heading = (heading + roll * dt * 0.8 + 360) % 360;

        // Engine EGT & Fuel Consumption
        egt = 420 + (n1 / 100) * 240;
        const currentFF = 1000 + (n1 / 100) * 2000;
        fuelTotal = Math.max(0, fuelTotal - (currentFF / 3600) * dt);

        // 3. RADAR TARGETS & TCAS PROXIMITY CALCULATIONS
        let activeTcas = null;
        const updatedTargets = radarTargets.map((tgt) => {
          let { distance, bearing, alt, speed, hdg, vsi: tVsi } = tgt;

          const radB = (bearing * Math.PI) / 180;
          let x = distance * Math.sin(radB);
          let y = distance * Math.cos(radB);

          // Relative motion vector
          const relSpeedKts = (speed - airspeed) * 0.0001 * dt;
          y += relSpeedKts;
          x += Math.sin(hdg * Math.PI / 180) * 0.006 * dt;

          distance = Math.sqrt(x * x + y * y);
          bearing = (Math.atan2(x, y) * 180 / Math.PI + 360) % 360;

          if (distance > 42) distance = 6 + Math.random() * 5;
          if (distance < 2) distance = 14;

          // TCAS Proximity Detection
          const altDiff = Math.abs(alt - altitude);
          if (distance <= 4.0 && altDiff <= 800) {
            activeTcas = { level: 'RA', callsign: tgt.callsign };
          } else if (distance <= 8.0 && altDiff <= 1500 && !activeTcas) {
            activeTcas = { level: 'TA', callsign: tgt.callsign };
          }

          return { ...tgt, distance, bearing, alt, hdg };
        });

        // Calculate Route Leg Progress %
        const legPct = Math.min(100, Math.round(((totalDistNM - distRemainingNM) / totalDistNM) * 100));

        // Update selected target reference if active
        let syncSelectedTarget = selectedTarget;
        if (selectedTarget) {
          syncSelectedTarget = updatedTargets.find(t => t.id === selectedTarget.id) || selectedTarget;
        }

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
          flaps,
          gearDown,
          preset,
          distRemainingNM: Math.round(distRemainingNM),
          legProgressPct: legPct,
          activeEvent,
          tcasAlert: activeTcas,
          radarTargets: updatedTargets,
          selectedTarget: syncSelectedTarget
        };
      });

      animFrameRef.current = requestAnimationFrame(updateTick);
    };

    animFrameRef.current = requestAnimationFrame(updateTick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [active]);

  // Helper Methods
  const setPreset = (presetName) => {
    setTelemetry((prev) => ({ ...prev, preset: presetName, autoFlightMode: false }));
    phaseTimerRef.current = 0;
  };

  const toggleAutoFlight = () => {
    setTelemetry((prev) => ({ ...prev, autoFlightMode: !prev.autoFlightMode }));
  };

  const toggleRandomManeuvers = () => {
    setTelemetry((prev) => ({ ...prev, randomManeuversEnabled: !prev.randomManeuversEnabled }));
  };

  const setSimSpeed = (speed) => {
    setTelemetry((prev) => ({ ...prev, simSpeed: speed }));
  };

  const setRadarRange = (rangeNM) => {
    setTelemetry((prev) => ({ ...prev, radarRangeNM: rangeNM }));
  };

  const setRadarMode = (mode) => {
    setTelemetry((prev) => ({ ...prev, radarMode: mode }));
  };

  const setSelectedTarget = (tgt) => {
    setTelemetry((prev) => ({ ...prev, selectedTarget: tgt }));
  };

  const adjustPitch = (delta) => {
    setTelemetry((prev) => ({ ...prev, pitch: Math.max(-30, Math.min(30, prev.pitch + delta)), autoFlightMode: false }));
  };

  const adjustRoll = (delta) => {
    setTelemetry((prev) => ({ ...prev, roll: Math.max(-45, Math.min(45, prev.roll + delta)), autoFlightMode: false }));
  };

  const toggleGear = () => {
    soundEngine.playGearClunk();
    setTelemetry((prev) => ({ ...prev, gearDown: !prev.gearDown }));
  };

  const setFlaps = (flapVal) => {
    setTelemetry((prev) => ({ ...prev, flaps: flapVal }));
  };

  const togglePanicMode = () => {
    const nextPanic = !telemetry.panicMode;
    if (nextPanic) {
      soundEngine.playPanicEmergencySequence();
      setTelemetry((prev) => ({ ...prev, panicMode: true }));
    } else {
      soundEngine.stopPanicEmergencySequence();
      setTelemetry((prev) => ({
        ...prev,
        panicMode: false,
        activeEvent: null,
        n1: prev.preset === 'CRUISE' ? 86.5 : prev.preset === 'CLIMB' ? 92 : 65,
        egt: 450,
        vsi: 0,
        pitch: prev.preset === 'CRUISE' ? 2.2 : 0,
        roll: 0
      }));
    }
  };

  return {
    telemetry,
    setPreset,
    toggleAutoFlight,
    toggleRandomManeuvers,
    togglePanicMode,
    setSimSpeed,
    setRadarRange,
    setRadarMode,
    setSelectedTarget,
    adjustPitch,
    adjustRoll,
    toggleGear,
    setFlaps
  };
}
