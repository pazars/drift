/**
 * @drift/cli - GPX preprocessing CLI tool
 *
 * This package provides tools for processing GPX files from Strava exports
 * into optimized formats for visualization.
 */

export const VERSION = '0.0.1';

// Parser exports
export { parseGPX, calculateMetadata } from './parsers';
export type { CalculatedMetadata } from './parsers';

// Transform exports
export { simplify3D, perpendicularDistance3D } from './transforms';

// Error exports
export { DriftError, GPXParseError, EmptyTrackError, InvalidCoordinatesError } from './errors';
export type {
  GPXParseErrorOptions,
  EmptyTrackErrorOptions,
  InvalidCoordinatesErrorOptions,
} from './errors';

// Processor exports
export { processGpxFile } from './processor.js';
export type { ProcessorOptions, ProcessedActivity } from './processor.js';

// Command exports
export { syncFiles, scanDirectory, buildIndex } from './commands/index.js';
export type { SyncOptions, SyncResult, FileProcessor, ProcessResult } from './commands/index.js';

// Utility exports
export { generateActivityId } from './utils/index.js';

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
