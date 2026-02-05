/**
 * 3D Douglas-Peucker track simplification algorithm.
 * @module transforms/simplify3d
 */

import type { TrackPoint } from '../types.js';

/** Default elevation weight factor */
const DEFAULT_ELEVATION_WEIGHT = 1.0;

/** Approximate meters per degree of latitude */
const METERS_PER_DEGREE_LAT = 111320;

/**
 * Calculate the perpendicular distance from a point to a line segment in 3D space.
 * Uses a simplified approach where lat/lon are treated as planar coordinates
 * scaled to approximate meters, and elevation is weighted.
 *
 * @param point - The point to measure distance from
 * @param lineStart - Start of the line segment
 * @param lineEnd - End of the line segment
 * @param elevationWeight - How much to weight elevation changes (default 1.0)
 * @returns Distance in approximate meters
 */
export function perpendicularDistance3D(
  point: TrackPoint,
  lineStart: TrackPoint,
  lineEnd: TrackPoint,
  elevationWeight = DEFAULT_ELEVATION_WEIGHT
): number {
  // Convert to approximate meters for distance calculation
  const avgLat = (lineStart.lat + lineEnd.lat) / 2;
  const metersPerDegreeLon = METERS_PER_DEGREE_LAT * Math.cos((avgLat * Math.PI) / 180);

  // Scale coordinates to meters
  const x1 = lineStart.lon * metersPerDegreeLon;
  const y1 = lineStart.lat * METERS_PER_DEGREE_LAT;
  const z1 = lineStart.ele * elevationWeight;

  const x2 = lineEnd.lon * metersPerDegreeLon;
  const y2 = lineEnd.lat * METERS_PER_DEGREE_LAT;
  const z2 = lineEnd.ele * elevationWeight;

  const x0 = point.lon * metersPerDegreeLon;
  const y0 = point.lat * METERS_PER_DEGREE_LAT;
  const z0 = point.ele * elevationWeight;

  // Vector from lineStart to lineEnd
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;

  // Length squared of line segment
  const lineLengthSq = dx * dx + dy * dy + dz * dz;

  // If line is just a point, return distance to that point
  if (lineLengthSq === 0) {
    const px = x0 - x1;
    const py = y0 - y1;
    const pz = z0 - z1;
    return Math.sqrt(px * px + py * py + pz * pz);
  }

  // Calculate projection parameter t
  // t = dot(point - lineStart, lineEnd - lineStart) / |lineEnd - lineStart|^2
  const t = Math.max(
    0,
    Math.min(1, ((x0 - x1) * dx + (y0 - y1) * dy + (z0 - z1) * dz) / lineLengthSq)
  );

  // Find closest point on line segment
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  const closestZ = z1 + t * dz;

  // Return distance to closest point
  const distX = x0 - closestX;
  const distY = y0 - closestY;
  const distZ = z0 - closestZ;

  return Math.sqrt(distX * distX + distY * distY + distZ * distZ);
}

/**
 * Simplify a track using the 3D Douglas-Peucker algorithm.
 *
 * This algorithm preserves points that are further than the tolerance from
 * the line connecting their neighbors, considering both horizontal and
 * vertical (elevation) distance.
 *
 * @param points - Array of track points to simplify
 * @param tolerance - Distance tolerance in degrees (roughly, due to 3D conversion)
 * @param elevationWeight - How much to weight elevation changes (default 1.0)
 * @returns Simplified array of track points
 */
export function simplify3D(
  points: TrackPoint[],
  tolerance: number,
  elevationWeight = DEFAULT_ELEVATION_WEIGHT
): TrackPoint[] {
  if (points.length <= 2) {
    return [...points];
  }

  // Convert tolerance from degrees to approximate meters
  const toleranceMeters = tolerance * METERS_PER_DEGREE_LAT;

  // Use iterative approach with a stack to avoid stack overflow on large datasets
  const result = douglasPeuckerIterative(points, toleranceMeters, elevationWeight);

  return result;
}

/**
 * Iterative implementation of Douglas-Peucker to handle large datasets.
 */
function douglasPeuckerIterative(
  points: TrackPoint[],
  toleranceMeters: number,
  elevationWeight: number
): TrackPoint[] {
  const n = points.length;
  if (n <= 2) return [...points];

  // Array to mark which points to keep
  const keep = new Array<boolean>(n).fill(false);
  keep[0] = true;
  keep[n - 1] = true;

  // Stack of ranges to process: [startIndex, endIndex]
  const stack: Array<[number, number]> = [[0, n - 1]];

  while (stack.length > 0) {
    const range = stack.pop()!;
    const start = range[0];
    const end = range[1];

    if (end - start <= 1) continue;

    // Find point with maximum distance
    let maxDist = 0;
    let maxIndex = start;

    const startPoint = points[start]!;
    const endPoint = points[end]!;

    for (let i = start + 1; i < end; i++) {
      const dist = perpendicularDistance3D(points[i]!, startPoint, endPoint, elevationWeight);

      if (dist > maxDist) {
        maxDist = dist;
        maxIndex = i;
      }
    }

    // If max distance is greater than tolerance, keep the point and recurse
    if (maxDist > toleranceMeters) {
      keep[maxIndex] = true;
      stack.push([start, maxIndex]);
      stack.push([maxIndex, end]);
    }
  }

  // Build result array with kept points
  const result: TrackPoint[] = [];
  for (let i = 0; i < n; i++) {
    if (keep[i]) {
      result.push(points[i]!);
    }
  }

  return result;
}
