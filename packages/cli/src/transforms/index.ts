/**
 * Track transformation utilities.
 * @module transforms
 */

export { simplify3D, perpendicularDistance3D } from './simplify3d.js';
export { analyzeGap, processSegments } from './segments.js';
export type {
  GapAnalysis,
  SegmentProcessingOptions,
  SegmentProcessingResult,
  MergeInfo,
} from './segments.js';
