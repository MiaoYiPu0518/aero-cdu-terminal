# Flight Simulation Logic

This document describes the behavior owned by `src/utils/useFlightSimulator.js`.
Keep it updated when adding a phase, an automated event, or a new manual override.

## Runtime and time

- `App.jsx` passes `showDashboard` to `useFlightSimulator(showDashboard)`.
- The animation loop runs only while the dashboard is active. Hiding the dashboard
  pauses simulation time and preserves the current telemetry.
- Each frame clamps wall-clock time to 0.2 seconds, applies the selected simulator
  speed (`1x`, `4x`, or `8x`), then clamps the effective simulation step to 0.2
  seconds. This prevents a large frame gap from jumping across a maneuver.
- React state is mirrored in `telemetryRef`; the loop reads and writes that ref so
  frame updates do not depend on asynchronous React updater timing.

## Automatic flight state machine

Automation starts enabled by default. When `autoFlightMode` is true, the current
`preset` drives the phase state machine:

| Phase | Main behavior | Transition |
| --- | --- | --- |
| `TAXI` | Holds 0 ft, accelerates toward 25 kt, gear down | After 8 simulated seconds -> `TAKEOFF` |
| `TAKEOFF` | Uses takeoff thrust and flaps 15; rotates above 150 kt | Above 1,000 ft -> `CLIMB` |
| `CLIMB` | 2,200 fpm toward `targetAlt` (normally 35,000 ft) | At target altitude -> `CRUISE` |
| `CRUISE` | Accelerates toward 440 kt and reduces route distance | At 60 NM remaining -> `DESCENT` |
| `DESCENT` | 1,800 fpm descent toward 3,500 ft | At 4,000 ft -> `APPROACH` |
| `APPROACH` | Gear down, flaps 30, 750 fpm descent | At 20 ft -> `TOUCHDOWN` |
| `TOUCHDOWN` | Holds 0 ft and slows to 5 kt | Returns to `TAXI` and resets route distance |

`TURBULENCE` is also available as a manual preset, but it is not an automatic
phase. Selecting any phase preset or using the manual pitch/roll controls disables
automation.

## Random automated events

Random events run only in automatic `CLIMB`, `CRUISE`, or `DESCENT` and only when
the dashboard's **MANEUVERS** switch is enabled.

- The next event delay is randomized independently after every cycle between 12
  and 42 simulated seconds. There is no fixed 18-second interval.
- The delay timer advances only while no event is active. An event's duration does
  not consume the waiting period for the next event.
- Event selection uses a random draw. The current event types are:
  - `WEATHER_DEVIATION`: banks left for 12 simulated seconds.
  - `ATC_STEP_CLIMB`: available in climb/cruise, requests 37,000 ft for 15 seconds.
  - `TCAS_AVOIDANCE`: climbs at approximately 2,500 fpm for 8 seconds.
  - `TURBULENCE`: applies time-varying pitch, roll, and vertical-speed gusts for
    10-18 simulated seconds while preserving the current phase's general climb,
    cruise, or descent trend.
- Event effects are applied after the normal phase update so an active event can
  temporarily override baseline pitch/VSI behavior without changing the phase.
- Disabling automation clears the active event and resets the event timers.
  Disabling maneuvers prevents new events; an already active event finishes.
  Turning automation or maneuvers back on starts a new randomized waiting period.

## Telemetry and display contract

- `useFlightSimulator` must keep `distRemainingNM` at full precision in
  `telemetryRef` and in the next telemetry object. Per-frame movement is often less
  than 0.1 NM; rounding before the next frame discards that movement and freezes
  the route at its previous display value.
- `FlightDashboard` owns presentation formatting: distance is shown to one decimal,
  leg progress uses a fractional percentage for the bar, and ETE is shown to the
  nearest second.
- If route values appear frozen, check the internal telemetry write-back before
  changing the display format. The dashboard should be reloaded after rebuilding
  the Vite bundle so the running app uses the current simulator code.

## Overrides and route behavior

- Panic mode is a higher-priority emergency override. It commands a rapid descent
  toward 10,000 ft with turbulence-like oscillation and a MAYDAY event.
- Turning panic mode off restores normal engine/flight values and resumes the
  existing phase.
- Changing routes resets route distance and progress, but does not restart the
  current aircraft phase.
- Route progress is reduced during takeoff, climb, cruise, descent, approach, and
  turbulence whenever airspeed is positive. This movement is independent of
  `autoFlightMode`, so manual flight also advances the route; taxi and touchdown do
  not. Telemetry keeps full-precision route distance so fractional movement is
  accumulated every frame; the dashboard formats NM to one decimal and exposes a
  fractional leg percentage. ETE is calculated to the nearest second using the
  remaining distance and a minimum effective speed of 140 kt.

## Change checklist for future agents

When modifying this simulator, update both the hook and this document if you:

1. Add or rename a flight phase.
2. Add an event type, eligibility rule, duration, or event effect.
3. Change manual-control behavior or dashboard visibility behavior.
4. Change the time-step clamp, simulator speed, or route-progress calculation.
