const EARTH_RADIUS_NM = 3440.065;

export const AIRPORT_COORDINATES = {
  KJFK: [-73.7781, 40.6413],
  EGLL: [-0.4543, 51.4700],
  EDDF: [8.5622, 50.0379],
  KLAX: [-118.4085, 33.9416],
  RJTT: [139.7798, 35.5523],
  OMDB: [55.3644, 25.2532],
  KSFO: [-122.3790, 37.6213],
  PHNL: [-157.9224, 21.3187],
  LFPG: [2.5559, 49.0097],
  YSSY: [151.1772, -33.9461],
  WSSS: [103.9894, 1.3644],
  KORD: [-87.9073, 41.9742],
  VHHH: [113.9185, 22.3080],
  ZBAA: [116.5975, 40.0799],
  KATL: [-84.4277, 33.6407],
  RKSI: [126.4505, 37.4602]
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toVector = ([lng, lat]) => {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const cosLat = Math.cos(latRad);
  return [
    cosLat * Math.cos(lngRad),
    cosLat * Math.sin(lngRad),
    Math.sin(latRad)
  ];
};

const fromVector = ([x, y, z]) => {
  const lng = Math.atan2(y, x) * (180 / Math.PI);
  const lat = Math.atan2(z, Math.sqrt((x * x) + (y * y))) * (180 / Math.PI);
  return [lng, lat];
};

export const getGreatCirclePoint = (start, end, progress = 0) => {
  if (!start || !end) return start || end || [0, 0];

  const a = toVector(start);
  const b = toVector(end);
  const dot = clamp((a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]), -1, 1);
  const angle = Math.acos(dot);
  const t = clamp(progress, 0, 1);

  if (angle < 0.000001) return [...start];

  const sinAngle = Math.sin(angle);
  const scaleA = Math.sin((1 - t) * angle) / sinAngle;
  const scaleB = Math.sin(t * angle) / sinAngle;
  return fromVector([
    (a[0] * scaleA) + (b[0] * scaleB),
    (a[1] * scaleA) + (b[1] * scaleB),
    (a[2] * scaleA) + (b[2] * scaleB)
  ]);
};

export const getGreatCirclePoints = (start, end, count = 64) => (
  Array.from({ length: Math.max(2, count) }, (_, index) => (
    getGreatCirclePoint(start, end, index / (Math.max(2, count) - 1))
  ))
);

export const getInitialBearing = (start, end) => {
  if (!start || !end) return 0;
  const lat1 = (start[1] * Math.PI) / 180;
  const lat2 = (end[1] * Math.PI) / 180;
  const deltaLng = ((end[0] - start[0]) * Math.PI) / 180;
  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x = (Math.cos(lat1) * Math.sin(lat2))
    - (Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng));
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
};

export const getDistanceNM = (start, end) => {
  if (!start || !end) return 0;
  const lat1 = (start[1] * Math.PI) / 180;
  const lat2 = (end[1] * Math.PI) / 180;
  const deltaLat = lat2 - lat1;
  const deltaLng = ((end[0] - start[0]) * Math.PI) / 180;
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_NM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const normalizeLongitude = (longitude) => {
  const normalized = ((longitude + 180) % 360 + 360) % 360 - 180;
  return normalized === -180 ? 180 : normalized;
};

// Unwrap a route into its shortest longitude span. This keeps routes such as
// Los Angeles → Tokyo from producing a 358° bounds interval at the dateline.
export const unwrapLongitudes = (coordinates = []) => {
  if (coordinates.length < 2) return coordinates.map(([lng, lat]) => [lng, lat]);

  return coordinates.reduce((unwrapped, coordinate, index) => {
    if (index === 0) return [[coordinate[0], coordinate[1]]];
    const previousLng = unwrapped[index - 1][0];
    let longitude = coordinate[0];
    while (longitude - previousLng > 180) longitude -= 360;
    while (longitude - previousLng < -180) longitude += 360;
    return [...unwrapped, [longitude, coordinate[1]]];
  }, []);
};

// Split GeoJSON linework at the antimeridian so MapLibre renders the short
// Pacific crossing instead of a line across the entire world copy.
export const splitAntimeridianLine = (coordinates = []) => {
  if (coordinates.length < 2) return [coordinates];

  const segments = [];
  let segment = [[normalizeLongitude(coordinates[0][0]), coordinates[0][1]]];

  coordinates.slice(1).forEach(([rawLongitude, latitude]) => {
    const previous = segment[segment.length - 1];
    const longitude = normalizeLongitude(rawLongitude);
    const rawDelta = longitude - previous[0];

    if (Math.abs(rawDelta) <= 180) {
      segment.push([longitude, latitude]);
      return;
    }

    const unwrappedLongitude = rawDelta > 0 ? longitude - 360 : longitude + 360;
    const boundary = rawDelta > 0 ? -180 : 180;
    const oppositeBoundary = boundary === 180 ? -180 : 180;
    const fraction = (boundary - previous[0]) / (unwrappedLongitude - previous[0]);
    const crossingLatitude = previous[1] + ((latitude - previous[1]) * fraction);

    segment.push([boundary, crossingLatitude]);
    segments.push(segment);
    segment = [[oppositeBoundary, crossingLatitude], [longitude, latitude]];
  });

  segments.push(segment);
  return segments;
};
