/**
 * Geographic utility functions.
 * @module utils/geo
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians.
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate the distance between two points using the Haversine formula.
 * @param lat1 - Latitude of first point in degrees
 * @param lon1 - Longitude of first point in degrees
 * @param lat2 - Latitude of second point in degrees
 * @param lon2 - Longitude of second point in degrees
 * @returns Distance in kilometers
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Calculate 3D distance including elevation change.
 * @param lat1 - Latitude of first point in degrees
 * @param lon1 - Longitude of first point in degrees
 * @param ele1 - Elevation of first point in meters
 * @param lat2 - Latitude of second point in degrees
 * @param lon2 - Longitude of second point in degrees
 * @param ele2 - Elevation of second point in meters
 * @returns Distance in kilometers
 */
export function distance3D(
  lat1: number,
  lon1: number,
  ele1: number,
  lat2: number,
  lon2: number,
  ele2: number
): number {
  const horizontalDist = haversineDistance(lat1, lon1, lat2, lon2);
  const verticalDist = (ele2 - ele1) / 1000; // Convert meters to km
  return Math.sqrt(horizontalDist * horizontalDist + verticalDist * verticalDist);
}
