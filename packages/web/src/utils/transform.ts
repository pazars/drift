import type { Activity, ActivityType } from '../types';

/**
 * Bounding box from CLI output
 */
export interface CliBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Elevation statistics from CLI output
 */
export interface CliElevation {
  gain: number;
  loss: number;
  max: number;
  min: number;
}

/**
 * Sport types used by the CLI
 */
export type CliSportType =
  | 'cycling'
  | 'running'
  | 'hiking'
  | 'walking'
  | 'skiing'
  | 'swimming'
  | 'other';

/**
 * Activity metadata format from CLI index.json
 */
export interface CliActivity {
  id: string;
  name: string;
  sport: CliSportType;
  date: string;
  distance: number; // in kilometers
  duration: number; // in seconds
  movingTime: number; // in seconds
  elevation: CliElevation;
  bounds: CliBounds;
  segments: number;
  pointCount: {
    original: number;
    simplified: number;
  };
  overviewPolyline: string;
  tags?: string[];
}

/**
 * CLI index.json format
 */
export interface CliIndex {
  version: number;
  generated: string;
  activities: CliActivity[];
}

/**
 * Maps CLI sport types to web activity types
 */
const SPORT_TYPE_MAP: Record<CliSportType, ActivityType> = {
  running: 'run',
  cycling: 'ride',
  hiking: 'hike',
  walking: 'walk',
  swimming: 'swim',
  skiing: 'ski',
  other: 'other',
};

/**
 * Transform a CLI activity to web Activity format.
 *
 * Converts:
 * - sport type: running → run, cycling → ride, etc.
 * - distance: km → meters
 * - elevation: extracts gain from elevation object
 */
export function transformCliActivity(cliActivity: CliActivity): Activity {
  const type = SPORT_TYPE_MAP[cliActivity.sport] ?? 'other';

  return {
    id: cliActivity.id,
    name: cliActivity.name,
    type,
    date: cliActivity.date,
    distance: Math.round(cliActivity.distance * 1000), // km to meters
    duration: cliActivity.duration,
    elevation: cliActivity.elevation.gain,
    polyline: cliActivity.overviewPolyline,
    bounds: cliActivity.bounds,
    tags: cliActivity.tags,
  };
}

/**
 * Calculate combined bounds from multiple activities.
 * Returns undefined if no activities have bounds.
 */
export function calculateCombinedBounds(activities: Activity[]): CliBounds | undefined {
  const activitiesWithBounds = activities.filter(
    (a): a is Activity & { bounds: CliBounds } => a.bounds !== undefined
  );

  const firstActivity = activitiesWithBounds[0];
  if (!firstActivity) {
    return undefined;
  }

  const firstBounds = firstActivity.bounds;

  return activitiesWithBounds.reduce(
    (combined, activity) => ({
      north: Math.max(combined.north, activity.bounds.north),
      south: Math.min(combined.south, activity.bounds.south),
      east: Math.max(combined.east, activity.bounds.east),
      west: Math.min(combined.west, activity.bounds.west),
    }),
    {
      north: firstBounds.north,
      south: firstBounds.south,
      east: firstBounds.east,
      west: firstBounds.west,
    }
  );
}
