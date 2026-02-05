/**
 * Flexible Polyline encoder for track overview rendering.
 * @module writers/polyline
 */

import { encode, decode, ALTITUDE } from '@here/flexpolyline';
import type { TrackPoint } from '../types.js';

/** Default precision for lat/lon coordinates (5 = ~1m accuracy) */
const DEFAULT_PRECISION = 5;

/** Default precision for altitude (0 = 1m accuracy) */
const DEFAULT_THIRD_DIM_PRECISION = 0;

/**
 * Options for polyline encoding.
 */
export interface PolylineEncodingOptions {
  /** Precision for lat/lon (default: 5, ~1m accuracy) */
  precision?: number;
  /** Precision for altitude (default: 0, 1m accuracy) */
  thirdDimPrecision?: number;
}

/**
 * Encode track points as a Flexible Polyline string.
 *
 * Flexible Polylines provide efficient lossy compression of coordinate lists,
 * suitable for overview rendering where sub-meter precision isn't needed.
 *
 * @param points - Array of track points with lat, lon, ele
 * @param options - Optional encoding parameters
 * @returns Encoded polyline string
 */
export function encodeFlexiblePolyline(
  points: TrackPoint[],
  options?: PolylineEncodingOptions
): string {
  const precision = options?.precision ?? DEFAULT_PRECISION;
  const thirdDimPrecision = options?.thirdDimPrecision ?? DEFAULT_THIRD_DIM_PRECISION;

  // Convert TrackPoint[] to [[lat, lon, ele], ...]
  const polyline = points.map((p) => [p.lat, p.lon, p.ele]);

  return encode({
    polyline,
    precision,
    thirdDim: ALTITUDE,
    thirdDimPrecision,
  });
}

/**
 * Decode a Flexible Polyline string back to track points.
 *
 * @param encoded - Encoded polyline string
 * @returns Array of track points
 */
export function decodeFlexiblePolyline(encoded: string): TrackPoint[] {
  const result = decode(encoded);

  // Convert [[lat, lon, ele], ...] back to TrackPoint[]
  return result.polyline.map((coords) => ({
    lat: coords[0]!,
    lon: coords[1]!,
    ele: coords[2] ?? 0, // Default to 0 if no altitude
  }));
}
