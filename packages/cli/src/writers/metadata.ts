/**
 * Metadata index writer for activity collection.
 * @module writers/metadata
 */

import type { ActivityMetadata } from '../types';

/** Current index schema version */
const INDEX_VERSION = 1;

/**
 * Metadata index containing all processed activities.
 */
export interface MetadataIndex {
  /** Schema version for future compatibility */
  version: number;
  /** Timestamp when index was last generated/updated */
  generatedAt: Date;
  /** List of activity metadata, sorted by date (newest first) */
  activities: ActivityMetadata[];
}

/**
 * Serialized form of the metadata index (for JSON storage).
 */
interface SerializedIndex {
  version: number;
  generatedAt: string;
  activities: SerializedActivity[];
}

/**
 * Serialized form of activity metadata (dates as ISO strings).
 */
type SerializedActivity = Omit<ActivityMetadata, 'date'> & {
  date: string;
};

/**
 * Create a new metadata index.
 *
 * @param activities - Optional initial activities (will be sorted)
 * @returns New metadata index
 */
export function createMetadataIndex(activities: ActivityMetadata[] = []): MetadataIndex {
  return {
    version: INDEX_VERSION,
    generatedAt: new Date(),
    activities: sortByDateDescending([...activities]),
  };
}

/**
 * Add or update an activity in the index.
 *
 * If an activity with the same id exists, it will be replaced.
 * The index is re-sorted after the operation.
 *
 * @param index - Existing metadata index
 * @param activity - Activity to add or update
 * @returns Updated metadata index
 */
export function addToIndex(index: MetadataIndex, activity: ActivityMetadata): MetadataIndex {
  // Filter out existing activity with same id
  const filtered = index.activities.filter((a) => a.id !== activity.id);

  // Add new activity and re-sort
  const activities = sortByDateDescending([...filtered, activity]);

  return {
    version: index.version,
    generatedAt: new Date(),
    activities,
  };
}

/**
 * Serialize metadata index to JSON string.
 *
 * Dates are converted to ISO strings for JSON compatibility.
 *
 * @param index - Metadata index to serialize
 * @returns JSON string with 2-space indentation
 */
export function serializeIndex(index: MetadataIndex): string {
  const serialized: SerializedIndex = {
    version: index.version,
    generatedAt: index.generatedAt.toISOString(),
    activities: index.activities.map(serializeActivity),
  };

  return JSON.stringify(serialized, null, 2);
}

/**
 * Deserialize JSON string back to metadata index.
 *
 * ISO date strings are converted back to Date objects.
 *
 * @param json - JSON string to parse
 * @returns Restored metadata index
 */
export function deserializeIndex(json: string): MetadataIndex {
  const parsed = JSON.parse(json) as SerializedIndex;

  return {
    version: parsed.version,
    generatedAt: new Date(parsed.generatedAt),
    activities: parsed.activities.map(deserializeActivity),
  };
}

/**
 * Sort activities by date in descending order (newest first).
 */
function sortByDateDescending(activities: ActivityMetadata[]): ActivityMetadata[] {
  return activities.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Serialize a single activity (convert Date to ISO string).
 */
function serializeActivity(activity: ActivityMetadata): SerializedActivity {
  return {
    ...activity,
    date: activity.date.toISOString(),
  };
}

/**
 * Deserialize a single activity (convert ISO string to Date).
 */
function deserializeActivity(serialized: SerializedActivity): ActivityMetadata {
  return {
    ...serialized,
    date: new Date(serialized.date),
  };
}
