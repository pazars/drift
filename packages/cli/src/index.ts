/**
 * @drift/cli - GPX preprocessing CLI tool
 *
 * This package provides tools for processing GPX files from Strava exports
 * into optimized formats for visualization.
 */

export const VERSION = '0.0.1';

// Type exports
export type {
  TrackPoint,
  TrackPointExtensions,
  TrackSegment,
  ParsedTrack,
  ParseResult,
  ElevationStats,
  BoundingBox,
  SportType,
  ActivityMetadata,
} from './types';
