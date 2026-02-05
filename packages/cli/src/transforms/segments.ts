/**
 * Segment gap analysis and merging.
 * @module transforms/segments
 */

import { haversineDistance } from '../utils/geo.js';
import type { TrackSegment } from '../types.js';

/** Default maximum time gap for merging (5 minutes) */
const DEFAULT_MAX_TIME_GAP_SECONDS = 300;

/** Default maximum distance gap for merging (500 meters = 0.5 km) */
const DEFAULT_MAX_DISTANCE_GAP_KM = 0.5;

/**
 * Gap analysis result between two segments.
 */
export interface GapAnalysis {
  /** Time gap in seconds (0 if no timestamps) */
  timeGapSeconds: number;
  /** Distance gap in kilometers */
  distanceGapKm: number;
  /** Whether segments should be merged based on thresholds */
  shouldMerge: boolean;
}

/**
 * Options for segment processing.
 */
export interface SegmentProcessingOptions {
  /** Maximum time gap in seconds to allow merging (default: 300 = 5 min) */
  maxTimeGapSeconds?: number;
  /** Maximum distance gap in km to allow merging (default: 0.5 km) */
  maxDistanceGapKm?: number;
}

/**
 * Merge information from segment processing.
 */
export interface MergeInfo {
  /** Original number of segments */
  originalCount: number;
  /** Number of segments after merging */
  resultCount: number;
  /** Number of merge operations performed */
  mergedCount: number;
}

/**
 * Result of processing segments.
 */
export interface SegmentProcessingResult {
  /** Processed (potentially merged) segments */
  segments: TrackSegment[];
  /** Gap analysis for each original gap */
  gaps: GapAnalysis[];
  /** Information about merging operations */
  mergeInfo?: MergeInfo;
}

/**
 * Analyze the gap between two consecutive segments.
 *
 * @param seg1 - First segment (earlier in time/position)
 * @param seg2 - Second segment (later in time/position)
 * @param options - Processing options with thresholds
 * @returns Gap analysis with time, distance, and merge recommendation
 */
export function analyzeGap(
  seg1: TrackSegment,
  seg2: TrackSegment,
  options?: SegmentProcessingOptions
): GapAnalysis {
  const maxTimeGap = options?.maxTimeGapSeconds ?? DEFAULT_MAX_TIME_GAP_SECONDS;
  const maxDistanceGap = options?.maxDistanceGapKm ?? DEFAULT_MAX_DISTANCE_GAP_KM;

  // Handle empty segments
  if (seg1.points.length === 0 || seg2.points.length === 0) {
    return {
      timeGapSeconds: 0,
      distanceGapKm: 0,
      shouldMerge: true, // Merge if one is empty
    };
  }

  const lastPoint1 = seg1.points[seg1.points.length - 1]!;
  const firstPoint2 = seg2.points[0]!;

  // Calculate time gap
  let timeGapSeconds = 0;
  if (lastPoint1.time && firstPoint2.time) {
    timeGapSeconds = Math.floor((firstPoint2.time.getTime() - lastPoint1.time.getTime()) / 1000);
    // Ensure non-negative (handle out-of-order segments)
    timeGapSeconds = Math.max(0, timeGapSeconds);
  }

  // Calculate distance gap
  const distanceGapKm = haversineDistance(
    lastPoint1.lat,
    lastPoint1.lon,
    firstPoint2.lat,
    firstPoint2.lon
  );

  // Determine if should merge
  // Both conditions must be met: time gap is small AND distance gap is small
  const timeOk = timeGapSeconds === 0 || timeGapSeconds <= maxTimeGap;
  const distanceOk = distanceGapKm <= maxDistanceGap;
  const shouldMerge = timeOk && distanceOk;

  return {
    timeGapSeconds,
    distanceGapKm,
    shouldMerge,
  };
}

/**
 * Process segments by analyzing gaps and merging where appropriate.
 *
 * @param segments - Array of track segments to process
 * @param options - Processing options with configurable thresholds
 * @returns Processed segments with gap analysis metadata
 */
export function processSegments(
  segments: TrackSegment[],
  options?: SegmentProcessingOptions
): SegmentProcessingResult {
  if (segments.length === 0) {
    return {
      segments: [],
      gaps: [],
    };
  }

  if (segments.length === 1) {
    return {
      segments: [...segments],
      gaps: [],
    };
  }

  const gaps: GapAnalysis[] = [];
  const resultSegments: TrackSegment[] = [];

  // Start with the first segment
  let currentSegment: TrackSegment = {
    points: [...segments[0]!.points],
  };

  // Process each pair of consecutive segments
  for (let i = 1; i < segments.length; i++) {
    const nextSegment = segments[i]!;
    const gap = analyzeGap(currentSegment, nextSegment, options);
    gaps.push(gap);

    if (gap.shouldMerge) {
      // Merge: append next segment's points to current
      currentSegment.points.push(...nextSegment.points);
    } else {
      // Don't merge: save current and start new
      resultSegments.push(currentSegment);
      currentSegment = {
        points: [...nextSegment.points],
      };
    }
  }

  // Don't forget the last segment
  resultSegments.push(currentSegment);

  const mergeInfo: MergeInfo = {
    originalCount: segments.length,
    resultCount: resultSegments.length,
    mergedCount: segments.length - resultSegments.length,
  };

  return {
    segments: resultSegments,
    gaps,
    mergeInfo,
  };
}
