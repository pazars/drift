import { describe, it, expect } from 'vitest';
import { createMetadataIndex, addToIndex, serializeIndex, deserializeIndex } from '../metadata';
import type { ActivityMetadata } from '../../types';

// Type for parsed JSON to avoid 'any' in tests
interface ParsedIndex {
  version: number;
  generatedAt: string;
  activities: Array<{
    id: string;
    name: string;
    sport: string;
    date: string;
    distance: number;
    tags?: string[];
    [key: string]: unknown;
  }>;
}

// Helper to create activity metadata
function createActivity(overrides?: Partial<ActivityMetadata>): ActivityMetadata {
  return {
    id: `activity-${Math.random().toString(36).slice(2, 8)}`,
    sourceFile: '/path/to/activity.gpx',
    name: 'Morning Run',
    sport: 'running',
    date: new Date('2024-01-15T08:00:00Z'),
    distance: 5.5,
    duration: 1800,
    movingTime: 1750,
    elevation: {
      gain: 50,
      loss: 45,
      max: 120,
      min: 100,
    },
    bounds: {
      north: 37.78,
      south: 37.77,
      east: -122.41,
      west: -122.42,
    },
    segments: 1,
    pointCount: {
      original: 100,
      simplified: 50,
    },
    ...overrides,
  };
}

describe('createMetadataIndex', () => {
  it('creates an empty index with version and timestamp', () => {
    const index = createMetadataIndex();

    expect(index.version).toBe(1);
    expect(index.generatedAt).toBeInstanceOf(Date);
    expect(index.activities).toEqual([]);
  });

  it('creates index with provided activities', () => {
    const activities = [createActivity({ id: 'activity-1' }), createActivity({ id: 'activity-2' })];

    const index = createMetadataIndex(activities);

    expect(index.activities).toHaveLength(2);
  });

  it('sorts activities by date (newest first)', () => {
    const activities = [
      createActivity({ id: 'old', date: new Date('2024-01-01T08:00:00Z') }),
      createActivity({ id: 'new', date: new Date('2024-12-31T08:00:00Z') }),
      createActivity({ id: 'mid', date: new Date('2024-06-15T08:00:00Z') }),
    ];

    const index = createMetadataIndex(activities);

    expect(index.activities[0]?.id).toBe('new');
    expect(index.activities[1]?.id).toBe('mid');
    expect(index.activities[2]?.id).toBe('old');
  });
});

describe('addToIndex', () => {
  it('adds a new activity to the index', () => {
    const index = createMetadataIndex();
    const activity = createActivity({ id: 'new-activity' });

    const updated = addToIndex(index, activity);

    expect(updated.activities).toHaveLength(1);
    expect(updated.activities[0]?.id).toBe('new-activity');
  });

  it('maintains sort order when adding', () => {
    const index = createMetadataIndex([
      createActivity({ id: 'existing', date: new Date('2024-06-01T08:00:00Z') }),
    ]);
    const newer = createActivity({ id: 'newer', date: new Date('2024-12-01T08:00:00Z') });
    const older = createActivity({ id: 'older', date: new Date('2024-01-01T08:00:00Z') });

    const withNewer = addToIndex(index, newer);
    const withBoth = addToIndex(withNewer, older);

    expect(withBoth.activities[0]?.id).toBe('newer');
    expect(withBoth.activities[1]?.id).toBe('existing');
    expect(withBoth.activities[2]?.id).toBe('older');
  });

  it('updates existing activity with same id', () => {
    const original = createActivity({
      id: 'same-id',
      name: 'Original Name',
      date: new Date('2024-01-15T08:00:00Z'),
    });
    const index = createMetadataIndex([original]);

    const updated = createActivity({
      id: 'same-id',
      name: 'Updated Name',
      date: new Date('2024-01-15T08:00:00Z'),
    });
    const result = addToIndex(index, updated);

    expect(result.activities).toHaveLength(1);
    expect(result.activities[0]?.name).toBe('Updated Name');
  });

  it('updates generatedAt timestamp', () => {
    const index = createMetadataIndex();
    const originalTimestamp = index.generatedAt;

    // Small delay to ensure different timestamp
    const activity = createActivity();
    const updated = addToIndex(index, activity);

    expect(updated.generatedAt.getTime()).toBeGreaterThanOrEqual(originalTimestamp.getTime());
  });
});

describe('serializeIndex', () => {
  it('returns valid JSON string', () => {
    const index = createMetadataIndex([createActivity()]);

    const json = serializeIndex(index);

    expect(() => JSON.parse(json) as ParsedIndex).not.toThrow();
  });

  it('serializes dates as ISO strings', () => {
    const activity = createActivity({
      date: new Date('2024-06-15T14:30:00Z'),
    });
    const index = createMetadataIndex([activity]);

    const json = serializeIndex(index);
    const parsed = JSON.parse(json) as ParsedIndex;

    expect(parsed.activities[0]?.date).toBe('2024-06-15T14:30:00.000Z');
    expect(typeof parsed.generatedAt).toBe('string');
  });

  it('includes all activity fields', () => {
    const activity = createActivity({
      id: 'test-123',
      name: 'Test Activity',
      sport: 'cycling',
      distance: 25.5,
      tags: ['outdoor', 'training'],
    });
    const index = createMetadataIndex([activity]);

    const json = serializeIndex(index);
    const parsed = JSON.parse(json) as ParsedIndex;

    expect(parsed.activities[0]?.id).toBe('test-123');
    expect(parsed.activities[0]?.name).toBe('Test Activity');
    expect(parsed.activities[0]?.sport).toBe('cycling');
    expect(parsed.activities[0]?.distance).toBe(25.5);
    expect(parsed.activities[0]?.tags).toEqual(['outdoor', 'training']);
  });

  it('formats JSON with indentation', () => {
    const index = createMetadataIndex([createActivity()]);

    const json = serializeIndex(index);

    // Check for indentation (newlines with spaces)
    expect(json).toContain('\n');
    expect(json).toMatch(/\n\s+/);
  });
});

describe('deserializeIndex', () => {
  it('parses JSON back to index object', () => {
    const original = createMetadataIndex([createActivity()]);
    const json = serializeIndex(original);

    const restored = deserializeIndex(json);

    expect(restored.version).toBe(original.version);
    expect(restored.activities).toHaveLength(original.activities.length);
  });

  it('restores Date objects from ISO strings', () => {
    const activity = createActivity({
      date: new Date('2024-06-15T14:30:00Z'),
    });
    const original = createMetadataIndex([activity]);
    const json = serializeIndex(original);

    const restored = deserializeIndex(json);

    expect(restored.generatedAt).toBeInstanceOf(Date);
    expect(restored.activities[0]?.date).toBeInstanceOf(Date);
    expect(restored.activities[0]?.date.toISOString()).toBe('2024-06-15T14:30:00.000Z');
  });

  it('round-trips without data loss', () => {
    const activities = [
      createActivity({
        id: 'activity-1',
        name: 'Morning Run',
        date: new Date('2024-01-15T08:00:00Z'),
        distance: 5.5,
        elevation: { gain: 100, loss: 95, max: 200, min: 50 },
        tags: ['morning', 'urban'],
      }),
      createActivity({
        id: 'activity-2',
        name: 'Evening Ride',
        date: new Date('2024-01-16T18:00:00Z'),
        sport: 'cycling',
        distance: 25.5,
      }),
    ];
    const original = createMetadataIndex(activities);
    const json = serializeIndex(original);

    const restored = deserializeIndex(json);

    expect(restored.activities).toHaveLength(2);
    expect(restored.activities[0]?.id).toBe('activity-2'); // Sorted by date
    expect(restored.activities[0]?.distance).toBe(25.5);
    expect(restored.activities[1]?.tags).toEqual(['morning', 'urban']);
  });
});

describe('edge cases', () => {
  it('handles empty activities array', () => {
    const index = createMetadataIndex([]);
    const json = serializeIndex(index);
    const restored = deserializeIndex(json);

    expect(restored.activities).toEqual([]);
  });

  it('handles activities with optional fields missing', () => {
    // Create activity without optional fields
    const activity: ActivityMetadata = {
      id: 'test-no-optionals',
      sourceFile: '/path/to/activity.gpx',
      name: 'Test Activity',
      sport: 'running',
      date: new Date('2024-01-15T08:00:00Z'),
      distance: 5.5,
      duration: 1800,
      movingTime: 1750,
      elevation: { gain: 50, loss: 45, max: 120, min: 100 },
      bounds: { north: 37.78, south: 37.77, east: -122.41, west: -122.42 },
      segments: 1,
      pointCount: { original: 100, simplified: 50 },
      // tags and overviewPolyline intentionally omitted
    };

    const index = createMetadataIndex([activity]);
    const json = serializeIndex(index);
    const restored = deserializeIndex(json);

    expect(restored.activities[0]?.tags).toBeUndefined();
  });

  it('handles large number of activities', () => {
    const activities = Array.from({ length: 100 }, (_, i) =>
      createActivity({
        id: `activity-${i}`,
        date: new Date(Date.now() - i * 86400000),
      })
    );

    const index = createMetadataIndex(activities);
    const json = serializeIndex(index);
    const restored = deserializeIndex(json);

    expect(restored.activities).toHaveLength(100);
    // First should be newest (i=0 has most recent date)
    expect(restored.activities[0]?.id).toBe('activity-0');
  });
});
