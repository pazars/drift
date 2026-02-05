import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildIndex } from '../build-index';
import { writeFlatGeobuf } from '../../writers/flatgeobuf';
import type { ActivityMetadata, TrackSegment } from '../../types';
import { saveTagStore, createTagStore, addTag, defineTag } from '../tag';

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

describe('buildIndex', () => {
  let outputDir: string;

  beforeEach(async () => {
    outputDir = join(tmpdir(), `build-index-test-${Date.now()}`);
    await mkdir(join(outputDir, 'flatgeobuf'), { recursive: true });
    await mkdir(join(outputDir, 'polyline'), { recursive: true });
  });

  afterEach(async () => {
    await rm(outputDir, { recursive: true, force: true });
  });

  const createTestActivity = (id: string, name: string, date: Date): ActivityMetadata => ({
    id,
    sourceFile: `/path/to/${id}.gpx`,
    name,
    sport: 'running',
    date,
    distance: 5.0,
    duration: 1800,
    movingTime: 1750,
    elevation: { gain: 50, loss: 45, max: 120, min: 100 },
    bounds: { north: 57.0, south: 56.9, east: 24.2, west: 24.1 },
    segments: 1,
    pointCount: { original: 1000, simplified: 100 },
    overviewPolyline: 'BFoz5xJ67i1B',
    geometryFile: `flatgeobuf/${id}.fgb`,
  });

  const createTestSegments = (): TrackSegment[] => [
    {
      points: [
        { lat: 56.95, lon: 24.15, ele: 100 },
        { lat: 56.96, lon: 24.16, ele: 110 },
        { lat: 56.97, lon: 24.17, ele: 105 },
      ],
    },
  ];

  it('builds index from FlatGeobuf files', async () => {
    const activity = createTestActivity('abc123', 'Morning Run', new Date('2026-02-04T10:00:00Z'));
    const segments = createTestSegments();
    const fgbData = writeFlatGeobuf(segments, activity);
    await writeFile(join(outputDir, 'flatgeobuf', 'abc123.fgb'), fgbData);

    await buildIndex(outputDir);

    const indexContent = await readFile(join(outputDir, 'index.json'), 'utf-8');
    const index = JSON.parse(indexContent) as ParsedIndex;

    expect(index.version).toBe(1);
    expect(index.activities).toHaveLength(1);
    expect(index.activities[0]?.id).toBe('abc123');
    expect(index.activities[0]?.name).toBe('Morning Run');
  });

  it('sorts activities by date (newest first)', async () => {
    const activity1 = createTestActivity('older', 'Older Run', new Date('2026-02-01T10:00:00Z'));
    const activity2 = createTestActivity('newer', 'Newer Run', new Date('2026-02-04T10:00:00Z'));
    const segments = createTestSegments();

    await writeFile(
      join(outputDir, 'flatgeobuf', 'older.fgb'),
      writeFlatGeobuf(segments, activity1)
    );
    await writeFile(
      join(outputDir, 'flatgeobuf', 'newer.fgb'),
      writeFlatGeobuf(segments, activity2)
    );

    await buildIndex(outputDir);

    const indexContent = await readFile(join(outputDir, 'index.json'), 'utf-8');
    const index = JSON.parse(indexContent) as ParsedIndex;

    expect(index.activities[0]?.id).toBe('newer');
    expect(index.activities[1]?.id).toBe('older');
  });

  it('merges tags from tags.json', async () => {
    const activity = createTestActivity('tagged', 'Tagged Run', new Date('2026-02-04T10:00:00Z'));
    const segments = createTestSegments();
    await writeFile(
      join(outputDir, 'flatgeobuf', 'tagged.fgb'),
      writeFlatGeobuf(segments, activity)
    );

    // Create tags.json with a tag for this file
    let tagStore = createTagStore();
    tagStore = addTag(tagStore, '/path/to/tagged.gpx', 'favorite');
    tagStore = defineTag(tagStore, 'favorite', { color: '#ff0000' });
    await saveTagStore(tagStore, join(outputDir, 'tags.json'));

    await buildIndex(outputDir);

    const indexContent = await readFile(join(outputDir, 'index.json'), 'utf-8');
    const index = JSON.parse(indexContent) as ParsedIndex;

    expect(index.activities[0]?.tags).toEqual(['favorite']);
  });

  it('handles empty flatgeobuf directory', async () => {
    await buildIndex(outputDir);

    const indexContent = await readFile(join(outputDir, 'index.json'), 'utf-8');
    const index = JSON.parse(indexContent) as ParsedIndex;

    expect(index.activities).toEqual([]);
  });

  it('handles missing tags.json', async () => {
    const activity = createTestActivity('notags', 'No Tags', new Date('2026-02-04T10:00:00Z'));
    const segments = createTestSegments();
    await writeFile(
      join(outputDir, 'flatgeobuf', 'notags.fgb'),
      writeFlatGeobuf(segments, activity)
    );

    await buildIndex(outputDir);

    const indexContent = await readFile(join(outputDir, 'index.json'), 'utf-8');
    const index = JSON.parse(indexContent) as ParsedIndex;

    expect(index.activities[0]?.tags).toBeUndefined();
  });
});
