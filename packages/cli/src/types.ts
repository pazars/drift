/**
 * Core type definitions for GPX data structures.
 * @module types
 */

/** Extensions data from device-specific GPX fields (Garmin, Strava, etc.) */
export interface TrackPointExtensions {
  /** Heart rate in BPM */
  heartRate?: number;
  /** Power output in watts */
  power?: number;
  /** Cadence in RPM */
  cadence?: number;
  /** Temperature in Celsius */
  temperature?: number;
}

/** A single point in a GPS track with 3D coordinates */
export interface TrackPoint {
  /** Longitude in degrees */
  lon: number;
  /** Latitude in degrees */
  lat: number;
  /** Elevation in meters */
  ele: number;
  /** Timestamp of the point */
  time?: Date;
  /** Device-specific extension data */
  extensions?: TrackPointExtensions;
}

/** A continuous segment of track points (gap-free) */
export interface TrackSegment {
  points: TrackPoint[];
}

/** A parsed GPX track with metadata */
export interface ParsedTrack {
  /** Track name from GPX */
  name: string;
  /** Activity type from GPX */
  type?: string;
  /** Track segments (multiple if GPS signal was lost) */
  segments: TrackSegment[];
}

/** Result of parsing a GPX file */
export interface ParseResult {
  track: ParsedTrack;
  warnings: string[];
}

/** Elevation statistics for an activity */
export interface ElevationStats {
  /** Total meters climbed */
  gain: number;
  /** Total meters descended */
  loss: number;
  /** Highest elevation point */
  max: number;
  /** Lowest elevation point */
  min: number;
}

/** Geographic bounding box */
export interface BoundingBox {
  /** Northern latitude boundary */
  north: number;
  /** Southern latitude boundary */
  south: number;
  /** Eastern longitude boundary */
  east: number;
  /** Western longitude boundary */
  west: number;
}

/** Supported sport/activity types */
export type SportType =
  | 'cycling'
  | 'running'
  | 'hiking'
  | 'walking'
  | 'skiing'
  | 'swimming'
  | 'other';

/** Complete metadata for a processed activity */
export interface ActivityMetadata {
  /** Unique identifier for the activity */
  id: string;
  /** Original GPX file path */
  sourceFile: string;
  /** Activity name */
  name: string;
  /** Sport/activity type */
  sport: SportType;
  /** Activity start date/time */
  date: Date;
  /** Total distance in kilometers */
  distance: number;
  /** Total duration in seconds */
  duration: number;
  /** Moving time in seconds (excludes pauses) */
  movingTime: number;
  /** Elevation statistics */
  elevation: ElevationStats;
  /** Geographic bounds */
  bounds: BoundingBox;
  /** Number of track segments */
  segments: number;
  /** Point counts before/after simplification */
  pointCount: {
    original: number;
    simplified: number;
  };
  /** Encoded polyline for fast overview rendering */
  overviewPolyline?: string;
  /** Path to geometry file */
  geometryFile?: string;
  /** User-defined tags */
  tags?: string[];
}
