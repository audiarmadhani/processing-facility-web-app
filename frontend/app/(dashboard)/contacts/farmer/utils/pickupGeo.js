export const FACILITY_COORDINATES = {
  lat: -7.792770465082994,
  lng: 115.16020216205146,
};

const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function distanceToFacilityKm(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return haversineDistanceKm(
    lat,
    lng,
    FACILITY_COORDINATES.lat,
    FACILITY_COORDINATES.lng
  );
}

export function enrichPickupRowsWithFacilityDistance(rows) {
  return (rows || []).map((row) => ({
    ...row,
    facility_distance_km: distanceToFacilityKm(row.latitude, row.longitude),
  }));
}
