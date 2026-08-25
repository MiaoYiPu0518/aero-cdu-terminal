import React, { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Eye, MapPinned, Navigation, RotateCcw, Satellite } from 'lucide-react';
import {
  getGreatCirclePoint,
  getGreatCirclePoints,
  getInitialBearing,
  splitAntimeridianLine,
  unwrapLongitudes
} from '../utils/geo';

const SATELLITE_TILES = (import.meta.env.VITE_SATELLITE_TILES
  ? import.meta.env.VITE_SATELLITE_TILES.split(',')
  : [
    'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg',
    'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  ]).map((url) => url.trim()).filter(Boolean);
const PRIMARY_SATELLITE_TILE = SATELLITE_TILES[0];
const PASSENGER_WINDOW_PITCH = 42;
const PASSENGER_WINDOW_MAX_ZOOM = 13.5;
const PASSENGER_WINDOW_MIN_ZOOM = 8.8;
const PASSENGER_WINDOW_CRUISE_ALTITUDE_FT = 35000;
const PASSENGER_WINDOW_ALTITUDE_SCALE_FT = 1800;

const getPassengerWindowZoom = (altitudeFt) => {
  const safeAltitude = Number.isFinite(Number(altitudeFt)) ? Math.max(0, Number(altitudeFt)) : 0;
  // Ground footprint grows with altitude, so use a logarithmic response normalized
  // to the simulator's 35,000 ft cruise target instead of reaching the floor early.
  const altitudeProgress = Math.min(
    1,
    Math.log1p(safeAltitude / PASSENGER_WINDOW_ALTITUDE_SCALE_FT)
      / Math.log1p(PASSENGER_WINDOW_CRUISE_ALTITUDE_FT / PASSENGER_WINDOW_ALTITUDE_SCALE_FT)
  );
  const altitudeZoom = PASSENGER_WINDOW_MAX_ZOOM
    - (altitudeProgress * (PASSENGER_WINDOW_MAX_ZOOM - PASSENGER_WINDOW_MIN_ZOOM));
  return Math.min(PASSENGER_WINDOW_MAX_ZOOM, Math.max(PASSENGER_WINDOW_MIN_ZOOM, altitudeZoom));
};

const emptyFeatureCollection = () => ({ type: 'FeatureCollection', features: [] });

const lineFeature = (coordinates, properties = {}) => {
  const segments = splitAntimeridianLine(coordinates);
  return {
    type: 'Feature',
    properties,
    geometry: segments.length > 1
      ? { type: 'MultiLineString', coordinates: segments }
      : { type: 'LineString', coordinates }
  };
};

const pointFeature = (coordinates, properties = {}) => ({
  type: 'Feature',
  properties,
  geometry: { type: 'Point', coordinates }
});

export function TerrainFlightMap({ telemetry }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const planeMarkerRef = useRef(null);
  const lastCameraUpdateRef = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [satelliteReady, setSatelliteReady] = useState(false);
  const [followMode, setFollowMode] = useState(true);
  const [viewMode, setViewMode] = useState('TRACK');

  const {
    origin, destination, originCoords, destinationCoords, flightPosition,
    legProgressPct = 0, heading = 0, altitude = 0, airspeed = 0, preset = 'TAXI'
  } = telemetry;

  const routeCoordinates = useMemo(
    () => getGreatCirclePoints(originCoords, destinationCoords, 72),
    [originCoords, destinationCoords]
  );

  const currentPosition = flightPosition || getGreatCirclePoint(
    originCoords,
    destinationCoords,
    legProgressPct / 100
  );

  const flightBearing = useMemo(() => {
    const progress = Math.min(1, Math.max(0, legProgressPct / 100));
    const lookAhead = progress < 0.995 ? progress + 0.01 : Math.max(0, progress - 0.01);
    return getInitialBearing(
      currentPosition,
      getGreatCirclePoint(originCoords, destinationCoords, lookAhead)
    );
  }, [currentPosition, originCoords, destinationCoords, legProgressPct]);

  const passengerWindowZoom = useMemo(() => getPassengerWindowZoom(altitude), [altitude]);

  const completedCoordinates = useMemo(() => {
    const progress = Math.min(1, Math.max(0, legProgressPct / 100));
    const count = Math.max(2, Math.round(routeCoordinates.length * progress));
    return [...routeCoordinates.slice(0, count - 1), currentPosition];
  }, [routeCoordinates, currentPosition, legProgressPct]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return undefined;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      attributionControl: false,
      center: currentPosition,
      zoom: 3.2,
      bearing: flightBearing,
      minZoom: 1.5,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            // Keep one provider in the initial style. MapLibre treats a tiles
            // array as parallel tile templates, not as a failover list; a
            // dead fallback can therefore hold the whole style in LOADING.
            tiles: PRIMARY_SATELLITE_TILE ? [PRIMARY_SATELLITE_TILE] : [],
            tileSize: 256,
            attribution: 'Satellite imagery © EOX IT Services GmbH / Esri'
          },
          route: { type: 'geojson', data: emptyFeatureCollection() },
          completedRoute: { type: 'geojson', data: emptyFeatureCollection() },
          airports: { type: 'geojson', data: emptyFeatureCollection() }
        },
        layers: [
          { id: 'satellite', type: 'raster', source: 'satellite' },
          {
            id: 'route-line',
            type: 'line',
            source: 'route',
            paint: { 'line-color': '#61b5ff', 'line-width': 2.5, 'line-opacity': 0.78, 'line-dasharray': [2, 1.5] }
          },
          {
            id: 'completed-route-line',
            type: 'line',
            source: 'completedRoute',
            paint: { 'line-color': '#6dffbb', 'line-width': 3.2, 'line-opacity': 0.95 }
          },
          {
            id: 'airport-points',
            type: 'circle',
            source: 'airports',
            paint: { 'circle-radius': 4, 'circle-color': '#f6c453', 'circle-stroke-color': '#111923', 'circle-stroke-width': 1.5 }
          }
        ]
      }
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    const plane = document.createElement('div');
    plane.className = 'terrain-flight-plane';
    // Existing CC0 top-view asset downloaded from SVG Repo; its nose points north,
    // so the same flight bearing used by the camera also rotates the silhouette.
    plane.innerHTML = '<img src="/assets/plane-top-view.svg" alt="" aria-hidden="true" />';
    plane.title = 'Ownship';
    planeMarkerRef.current = new maplibregl.Marker({ element: plane, pitchAlignment: 'map', rotationAlignment: 'map' })
      .setLngLat(currentPosition)
      .addTo(map);

    let styleReady = false;
    const styleReadyTimer = window.setTimeout(() => {
      if (!styleReady) {
        console.warn('[TERRAIN MAP] style readiness timeout', { satellite: SATELLITE_TILES.length });
        setMapError(true);
      }
    }, 6500);
    let activeSatelliteIndex = 0;
    const failedSatelliteProviders = new Set();

    const markStyleReady = () => {
      if (styleReady) return;
      styleReady = true;
      setMapReady(true);
      map.resize();
    };

    map.on('style.load', markStyleReady);
    map.on('load', markStyleReady);
    map.on('sourcedata', (event) => {
      if (event.sourceId === 'satellite' && (event.sourceDataType === 'metadata' || event.sourceDataType === 'content')) {
        setSatelliteReady(true);
      }
    });
    map.on('error', (event) => {
      const sourceId = event?.sourceId || event?.error?.sourceId;
      const errorUrl = event?.error?.url || '';
      console.warn(`[TERRAIN MAP] MapLibre error source=${sourceId || 'none'} url=${errorUrl || 'none'} message=${event?.error?.message || event?.message || 'unknown'}`);
      const isSatelliteError = sourceId === 'satellite'
        || /tiles\.maps\.eox\.at|services\.arcgisonline\.com/i.test(errorUrl);
      if (isSatelliteError) {
        let providerMatched = false;
        SATELLITE_TILES.forEach((tileUrl, index) => {
          try {
            const host = new URL(tileUrl.replace(/\{[^}]+\}/g, '0')).host;
            if (errorUrl.includes(host)) {
              failedSatelliteProviders.add(index);
              providerMatched = true;
            }
          } catch (e) {
            // Ignore malformed optional fallback URLs.
          }
        });
        // Some MapLibre tile errors do not expose the failed URL. In that
        // case treat the currently selected provider as the failed one and
        // continue through the configured online fallback list.
        if (!providerMatched) failedSatelliteProviders.add(activeSatelliteIndex);
        const nextProviderIndex = SATELLITE_TILES.findIndex((_, index) => !failedSatelliteProviders.has(index));
        if (nextProviderIndex >= 0 && nextProviderIndex !== activeSatelliteIndex) {
          activeSatelliteIndex = nextProviderIndex;
          map.getSource('satellite')?.setTiles([SATELLITE_TILES[nextProviderIndex]]);
          setSatelliteReady(false);
        } else if (failedSatelliteProviders.size >= SATELLITE_TILES.length) {
          setMapError(true);
        }
        return;
      }
    });
    map.on('dragstart', () => setFollowMode(false));
    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      planeMarkerRef.current?.remove();
      planeMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
      setMapReady(false);
      setMapError(false);
      setSatelliteReady(false);
      window.clearTimeout(styleReadyTimer);
    };
  // The map is intentionally initialized once for the dashboard lifetime.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const routeSource = map.getSource('route');
    const completedSource = map.getSource('completedRoute');
    const airportSource = map.getSource('airports');
    routeSource?.setData(lineFeature(routeCoordinates));
    completedSource?.setData(lineFeature(completedCoordinates));
    airportSource?.setData({
      type: 'FeatureCollection',
      features: [
        pointFeature(originCoords, { code: origin }),
        pointFeature(destinationCoords, { code: destination })
      ]
    });

    planeMarkerRef.current?.setLngLat(currentPosition);
    const plane = planeMarkerRef.current?.getElement();
    if (plane) plane.style.setProperty('--plane-rotation', `${flightBearing}deg`);

    if (followMode && (viewMode === 'TRACK' || viewMode === 'WINDOW')) {
      const now = performance.now();
      if (now - lastCameraUpdateRef.current > 120) {
        lastCameraUpdateRef.current = now;
        map.easeTo({
          center: currentPosition,
          bearing: viewMode === 'WINDOW' ? (flightBearing + 90) % 360 : flightBearing,
          pitch: viewMode === 'WINDOW' ? PASSENGER_WINDOW_PITCH : 0,
          ...(viewMode === 'WINDOW' ? { zoom: passengerWindowZoom } : {}),
          duration: 260,
          essential: true
        });
      }
    }
  }, [mapReady, routeCoordinates, completedCoordinates, currentPosition, originCoords, destinationCoords, origin, destination, flightBearing, followMode, passengerWindowZoom, viewMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const hidden = viewMode === 'WINDOW' ? 'none' : 'visible';
    ['route-line', 'completed-route-line', 'airport-points'].forEach((layerId) => {
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', hidden);
    });
  }, [mapReady, viewMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const zoomHandlers = [map.scrollZoom, map.doubleClickZoom, map.touchZoomRotate, map.boxZoom];
    zoomHandlers.forEach((handler) => {
      if (viewMode === 'WINDOW') handler.disable();
      else handler.enable();
    });
  }, [mapReady, viewMode]);

  const routeBounds = useMemo(() => {
    const unwrappedRoute = unwrapLongitudes(routeCoordinates);
    if (unwrappedRoute.length < 2) return null;
    const lngs = unwrappedRoute.map(([lng]) => lng);
    const lats = unwrappedRoute.map(([, lat]) => lat);
    return new maplibregl.LngLatBounds(
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)]
    );
  }, [routeCoordinates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || viewMode !== 'ROUTE' || !routeBounds) return;
    map.fitBounds(routeBounds, { padding: 34, duration: 650, essential: true });
  }, [mapReady, routeBounds, viewMode]);

  const recenter = () => {
    setViewMode('TRACK');
    setFollowMode(true);
    mapRef.current?.easeTo({ center: currentPosition, bearing: flightBearing, pitch: 0, duration: 500, essential: true });
  };

  const showRoute = () => {
    setViewMode('ROUTE');
    setFollowMode(false);
    if (!routeBounds) return;
    mapRef.current?.fitBounds(routeBounds, { padding: 34, pitch: 0, duration: 650, essential: true });
  };

  const showPassengerWindow = () => {
    setViewMode('WINDOW');
    setFollowMode(true);
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({
      center: currentPosition,
      bearing: (flightBearing + 90) % 360,
      pitch: PASSENGER_WINDOW_PITCH,
      zoom: passengerWindowZoom,
      duration: 650,
      essential: true
    });
  };

  return (
    <section className={`terrain-flight-section ${viewMode === 'WINDOW' ? 'window-mode' : ''}`}>
      <div className="terrain-flight-header">
        <div className="terrain-flight-title">
          <Satellite size={13} />
          <span>SATELLITE FLIGHT MAP</span>
          <span className={`terrain-map-status ${mapReady && satelliteReady && !mapError ? 'online' : ''} ${mapError ? 'error' : ''}`}>
            {mapError ? 'DEGRADED' : mapReady && satelliteReady ? 'LIVE' : mapReady ? 'TILES' : 'LOADING'}
          </span>
        </div>
        <div className="terrain-flight-actions">
          <button className={`terrain-map-btn ${followMode && viewMode === 'TRACK' ? 'active' : ''}`} onClick={recenter} title="Follow ownship">
            <Navigation size={11} /> TRACK
          </button>
          <button className={`terrain-map-btn ${viewMode === 'ROUTE' ? 'active' : ''}`} onClick={showRoute} title="Show full route">
            <MapPinned size={11} /> ROUTE
          </button>
          <button className={`terrain-map-btn ${viewMode === 'WINDOW' ? 'active' : ''}`} onClick={showPassengerWindow} title="Show passenger window view" aria-pressed={viewMode === 'WINDOW'}>
            <Eye size={11} /> WINDOW
          </button>
          <button className="terrain-map-btn" onClick={recenter} title="Recenter map">
            <RotateCcw size={11} /> RECENTER
          </button>
        </div>
      </div>
      <div ref={mapContainerRef} className="terrain-flight-map" />
      {mapError && (
        <div className="terrain-map-error" role="status">
          SATELLITE LINK OFFLINE · CHECK NETWORK ACCESS
        </div>
      )}
      {!mapError && mapReady && !satelliteReady && (
        <div className="terrain-map-pending" role="status">REQUESTING ONLINE MAP TILES…</div>
      )}
      <div className="terrain-flight-footer">
        <span><MapPinned size={10} /> {origin} → {destination}</span>
        <span>{preset} · {Math.round(altitude).toLocaleString()} FT · {Math.round(airspeed)} KTS · HDG {Math.round(heading).toString().padStart(3, '0')}°</span>
        <span>{Math.min(100, Math.max(0, legProgressPct)).toFixed(1)}% COMPLETE</span>
      </div>
    </section>
  );
}
