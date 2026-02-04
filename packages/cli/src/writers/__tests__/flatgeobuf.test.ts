import { describe, it, expect } from 'vitest';
import { writeFlatGeobuf, readFlatGeobuf } from '../flatgeobuf';
import type { TrackSegment, ActivityMetadata } from '../../types';
import type { Feature, LineString, MultiLineString } from 'geojson';

// Helper to create track points
function point(lat: number, lon: number, ele: number, time?: Date) {
  const p: { lat: number; lon: number; ele: number; time?: Date } = { lat, lon, ele };
  if (time) p.time = time;
  return p;
}

// Helper to create a segment
function segment(points: ReturnType<typeof point>[]): TrackSegment {
  return { points };
}

// Sample metadata for testing
function createMetadata(overrides?: Partial<ActivityMetadata>): ActivityMetadata {
  return {
    id: 'test-activity-001',
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

describe('writeFlatGeobuf', () => {
  describe('basic functionality', () => {
    it('writes valid FlatGeobuf binary data', () => {
      const segments = [
        segment([
          point(37.77, -122.42, 100),
          point(37.775, -122.415, 110),
          point(37.78, -122.41, 105),
        ]),
      ];
      const metadata = createMetadata();

      const result = writeFlatGeobuf(segments, metadata);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('creates readable FlatGeobuf that round-trips correctly', async () => {
      const segments = [segment([point(37.77, -122.42, 100), point(37.78, -122.41, 110)])];
      const metadata = createMetadata();

      const buffer = writeFlatGeobuf(segments, metadata);
      const features = await readFlatGeobuf(buffer);

      expect(features).toHaveLength(1);
      expect(features[0]?.geometry.type).toBe('LineString');
    });
  });

  describe('geometry types', () => {
    it('creates LineString for single segment', async () => {
      const segments = [segment([point(37.77, -122.42, 100), point(37.78, -122.41, 110)])];
      const metadata = createMetadata({ segments: 1 });

      const buffer = writeFlatGeobuf(segments, metadata);
      const features = await readFlatGeobuf(buffer);
      const feature = features[0] as Feature<LineString>;

      expect(feature.geometry.type).toBe('LineString');
      expect(feature.geometry.coordinates).toHaveLength(2);
    });

    it('creates MultiLineString for multiple segments', async () => {
      const segments = [
        segment([point(37.77, -122.42, 100), point(37.775, -122.415, 105)]),
        segment([point(37.78, -122.41, 110), point(37.785, -122.405, 115)]),
      ];
      const metadata = createMetadata({ segments: 2 });

      const buffer = writeFlatGeobuf(segments, metadata);
      const features = await readFlatGeobuf(buffer);
      const feature = features[0] as Feature<MultiLineString>;

      expect(feature.geometry.type).toBe('MultiLineString');
      expect(feature.geometry.coordinates).toHaveLength(2);
    });
  });

  describe('3D coordinate support', () => {
    it('preserves elevation values', async () => {
      const segments = [
        segment([
          point(37.77, -122.42, 100),
          point(37.78, -122.41, 200),
          point(37.79, -122.4, 150),
        ]),
      ];
      const metadata = createMetadata();

      const buffer = writeFlatGeobuf(segments, metadata);
      const features = await readFlatGeobuf(buffer);
      const feature = features[0] as Feature<LineString>;

      // GeoJSON coordinates are [lon, lat, ele]
      expect(feature.geometry.coordinates[0]?.[2]).toBe(100);
      expect(feature.geometry.coordinates[1]?.[2]).toBe(200);
      expect(feature.geometry.coordinates[2]?.[2]).toBe(150);
    });

    it('preserves elevation in MultiLineString', async () => {
      const segments = [
        segment([point(37.77, -122.42, 100), point(37.78, -122.41, 150)]),
        segment([point(37.79, -122.4, 200), point(37.8, -122.39, 250)]),
      ];
      const metadata = createMetadata({ segments: 2 });

      const buffer = writeFlatGeobuf(segments, metadata);
      const features = await readFlatGeobuf(buffer);
      const feature = features[0] as Feature<MultiLineString>;

      expect(feature.geometry.coordinates[0]?.[0]?.[2]).toBe(100);
      expect(feature.geometry.coordinates[1]?.[0]?.[2]).toBe(200);
    });
  });

  describe('activity properties', () => {
    it('includes all metadata properties', async () => {
      const segments = [segment([point(37.77, -122.42, 100), point(37.78, -122.41, 110)])];
      const metadata = createMetadata({
        id: 'custom-id-123',
        name: 'Evening Hike',
        sport: 'hiking',
        distance: 10.5,
        duration: 3600,
      });

      const buffer = writeFlatGeobuf(segments, metadata);
      const features = await readFlatGeobuf(buffer);
      const props = features[0]?.properties;

      expect(props?.id).toBe('custom-id-123');
      expect(props?.name).toBe('Evening Hike');
      expect(props?.sport).toBe('hiking');
      expect(props?.distance).toBe(10.5);
      expect(props?.duration).toBe(3600);
    });

    it('includes elevation statistics', async () => {
      const segments = [segment([point(37.77, -122.42, 100), point(37.78, -122.41, 110)])];
      const metadata = createMetadata({
        elevation: { gain: 150, loss: 100, max: 500, min: 50 },
      });

      const buffer = writeFlatGeobuf(segments, metadata);
      const features = await readFlatGeobuf(buffer);
      const props = features[0]?.properties;

      expect(props?.elevationGain).toBe(150);
      expect(props?.elevationLoss).toBe(100);
      expect(props?.elevationMax).toBe(500);
      expect(props?.elevationMin).toBe(50);
    });

    it('serializes date as ISO string', async () => {
      const segments = [segment([point(37.77, -122.42, 100), point(37.78, -122.41, 110)])];
      const metadata = createMetadata({
        date: new Date('2024-06-15T14:30:00Z'),
      });

      const buffer = writeFlatGeobuf(segments, metadata);
      const features = await readFlatGeobuf(buffer);
      const props = features[0]?.properties;

      expect(props?.date).toBe('2024-06-15T14:30:00.000Z');
    });
  });

  describe('edge cases', () => {
    it('handles empty segments array', () => {
      const segments: TrackSegment[] = [];
      const metadata = createMetadata({ segments: 0 });

      const buffer = writeFlatGeobuf(segments, metadata);

      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBe(0);
    });

    it('handles single point segment', async () => {
      const segments = [segment([point(37.77, -122.42, 100)])];
      const metadata = createMetadata();

      const buffer = writeFlatGeobuf(segments, metadata);
      const features = await readFlatGeobuf(buffer);
      const feature = features[0] as Feature<LineString>;

      expect(feature.geometry.coordinates).toHaveLength(1);
    });

    it('handles segment with empty points array', () => {
      const segments = [segment([])];
      const metadata = createMetadata();

      const buffer = writeFlatGeobuf(segments, metadata);

      // Empty segment should be filtered out, resulting in empty buffer
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBe(0);
    });
  });

  describe('coordinate precision', () => {
    it('preserves coordinate precision', async () => {
      const segments = [
        segment([point(37.7749295, -122.4194155, 100.5), point(37.7850123, -122.4095678, 110.25)]),
      ];
      const metadata = createMetadata();

      const buffer = writeFlatGeobuf(segments, metadata);
      const features = await readFlatGeobuf(buffer);
      const feature = features[0] as Feature<LineString>;

      // FlatGeobuf uses double precision, should maintain precision
      expect(feature.geometry.coordinates[0]?.[0]).toBeCloseTo(-122.4194155, 6);
      expect(feature.geometry.coordinates[0]?.[1]).toBeCloseTo(37.7749295, 6);
      expect(feature.geometry.coordinates[0]?.[2]).toBeCloseTo(100.5, 2);
    });
  });
});

describe('readFlatGeobuf', () => {
  it('parses serialized FlatGeobuf to GeoJSON features', async () => {
    const segments = [segment([point(37.77, -122.42, 100), point(37.78, -122.41, 110)])];
    const metadata = createMetadata();

    const buffer = writeFlatGeobuf(segments, metadata);
    const features = await readFlatGeobuf(buffer);

    expect(Array.isArray(features)).toBe(true);
    expect(features[0]).toHaveProperty('type', 'Feature');
    expect(features[0]).toHaveProperty('geometry');
    expect(features[0]).toHaveProperty('properties');
  });
});
