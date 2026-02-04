/**
 * Track transformation utilities.
 * @module transforms
 */

export { simplify3D, perpendicularDistance3D } from './simplify3d';
export { analyzeGap, processSegments } from './segments';
export type {
  GapAnalysis,
  SegmentProcessingOptions,
  SegmentProcessingResult,
  MergeInfo,
} from './segments';
