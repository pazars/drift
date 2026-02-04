/**
 * Activity metadata calculation from parsed GPX tracks.
 * @module parsers/metadata
 */

import { haversineDistance } from '../utils/geo';
import type { ParsedTrack, TrackPoint, ElevationStats, BoundingBox } from '../types';

/** Default elevation threshold in meters to filter GPS noise */
const DEFAULT_ELEVATION_THRESHOLD = 2;

/** Pause threshold in seconds (pauses longer than this are excluded from moving time) */
const PAUSE_THRESHOLD_SECONDS = 120;

/**
 * Calculated metadata for an activity.
 */
export interface CalculatedMetadata {
  /** Total distance in kilometers */
  distance: number;
  /** Total duration in seconds */
  duration: number;
  /** Moving time in seconds (excludes pauses) */
  movingTime: number;
  /** Elevation statistics */
  elevation: ElevationStats;
  /** Geographic bounding box */
  bounds: BoundingBox;
  /** Number of track segments */
  segments: number;
  /** Point counts */
  pointCount: {
    original: number;
    simplified: number;
  };
}

/**
 * Calculate metadata from a parsed track.
 * @param track - Parsed GPX track
 * @param elevationThreshold - Minimum elevation change in meters to count (filters noise)
 * @returns Calculated metadata
 */
export function calculateMetadata(
  track: ParsedTrack,
  elevationThreshold = DEFAULT_ELEVATION_THRESHOLD
): CalculatedMetadata {
  const allPoints = track.segments.flatMap((seg) => seg.points);

  return {
    distance: calculateDistance(track),
    duration: calculateDuration(allPoints),
    movingTime: calculateMovingTime(allPoints),
    elevation: calculateElevationStats(allPoints, elevationThreshold),
    bounds: calculateBounds(allPoints),
    segments: track.segments.length,
    pointCount: {
      original: allPoints.length,
      simplified: allPoints.length,
    },
  };
}

/**
 * Calculate total distance across all segments.
 */
function calculateDistance(track: ParsedTrack): number {
  let totalDistance = 0;

  for (const segment of track.segments) {
    for (let i = 1; i < segment.points.length; i++) {
      const prev = segment.points[i - 1]!;
      const curr = segment.points[i]!;
      totalDistance += haversineDistance(prev.lat, prev.lon, curr.lat, curr.lon);
    }
  }

  return totalDistance;
}

/**
 * Calculate total duration from timestamps.
 */
function calculateDuration(points: TrackPoint[]): number {
  const pointsWithTime = points.filter((p) => p.time !== undefined);
  if (pointsWithTime.length < 2) return 0;

  const firstTime = pointsWithTime[0]!.time!;
  const lastTime = pointsWithTime[pointsWithTime.length - 1]!.time!;

  return Math.floor((lastTime.getTime() - firstTime.getTime()) / 1000);
}

/**
 * Calculate moving time excluding pauses.
 */
function calculateMovingTime(points: TrackPoint[]): number {
  let movingTime = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;

    if (prev.time && curr.time) {
      const timeDiff = (curr.time.getTime() - prev.time.getTime()) / 1000;
      // Only count if less than pause threshold
      if (timeDiff < PAUSE_THRESHOLD_SECONDS) {
        movingTime += timeDiff;
      }
    }
  }

  return Math.floor(movingTime);
}

/**
 * Calculate elevation statistics with noise filtering.
 */
function calculateElevationStats(points: TrackPoint[], threshold: number): ElevationStats {
  if (points.length === 0) {
    return { gain: 0, loss: 0, max: 0, min: 0 };
  }

  const elevations = points.map((p) => p.ele);
  const max = Math.max(...elevations);
  const min = Math.min(...elevations);

  // All elevations are 0 (no elevation data)
  if (max === 0 && min === 0) {
    return { gain: 0, loss: 0, max: 0, min: 0 };
  }

  let gain = 0;
  let loss = 0;
  let lastSignificantEle = elevations[0]!;

  for (let i = 1; i < elevations.length; i++) {
    const ele = elevations[i]!;
    const diff = ele - lastSignificantEle;

    // Only count changes above threshold
    if (Math.abs(diff) >= threshold) {
      if (diff > 0) {
        gain += diff;
      } else {
        loss += Math.abs(diff);
      }
      lastSignificantEle = ele;
    }
  }

  return {
    gain: Math.round(gain),
    loss: Math.round(loss),
    max: Math.round(max),
    min: Math.round(min),
  };
}

/**
 * Calculate geographic bounding box.
 */
function calculateBounds(points: TrackPoint[]): BoundingBox {
  if (points.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }

  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);

  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lons),
    west: Math.min(...lons),
  };
}
