import { describe, it, expect } from 'vitest';
import { analyzeGap, processSegments } from '../segments';
import type { TrackSegment, TrackPoint } from '../../types';

// Helper to create track points
function point(lat: number, lon: number, ele: number, time?: Date): TrackPoint {
  const p: TrackPoint = { lat, lon, ele };
  if (time) p.time = time;
  return p;
}

// Helper to create a segment
function segment(points: TrackPoint[]): TrackSegment {
  return { points };
}

describe('analyzeGap', () => {
  it('calculates time gap between segments', () => {
    const seg1 = segment([
      point(0, 0, 0, new Date('2024-01-15T10:00:00Z')),
      point(0.001, 0, 0, new Date('2024-01-15T10:01:00Z')),
    ]);
    const seg2 = segment([
      point(0.002, 0, 0, new Date('2024-01-15T10:05:00Z')),
      point(0.003, 0, 0, new Date('2024-01-15T10:06:00Z')),
    ]);

    const gap = analyzeGap(seg1, seg2);

    expect(gap.timeGapSeconds).toBe(240); // 4 minutes
  });

  it('calculates distance gap between segments', () => {
    const seg1 = segment([point(37.7749, -122.4194, 0), point(37.775, -122.419, 0)]);
    const seg2 = segment([
      point(37.78, -122.41, 0), // ~1km away
      point(37.781, -122.409, 0),
    ]);

    const gap = analyzeGap(seg1, seg2);

    expect(gap.distanceGapKm).toBeGreaterThan(0.5);
    expect(gap.distanceGapKm).toBeLessThan(2);
  });

  it('returns 0 time gap when no timestamps', () => {
    const seg1 = segment([point(0, 0, 0), point(0.001, 0, 0)]);
    const seg2 = segment([point(0.002, 0, 0), point(0.003, 0, 0)]);

    const gap = analyzeGap(seg1, seg2);

    expect(gap.timeGapSeconds).toBe(0);
  });

  it('handles empty segments', () => {
    const seg1 = segment([]);
    const seg2 = segment([point(0, 0, 0)]);

    const gap = analyzeGap(seg1, seg2);

    expect(gap.timeGapSeconds).toBe(0);
    expect(gap.distanceGapKm).toBe(0);
  });

  it('returns gap metadata', () => {
    const seg1 = segment([point(0, 0, 0, new Date('2024-01-15T10:00:00Z'))]);
    const seg2 = segment([point(0.01, 0, 0, new Date('2024-01-15T10:10:00Z'))]);

    const gap = analyzeGap(seg1, seg2);

    expect(gap).toHaveProperty('timeGapSeconds');
    expect(gap).toHaveProperty('distanceGapKm');
    expect(gap).toHaveProperty('shouldMerge');
  });
});

describe('processSegments', () => {
  describe('merging behavior', () => {
    it('merges segments with small gaps', () => {
      const segments = [
        segment([
          point(0, 0, 0, new Date('2024-01-15T10:00:00Z')),
          point(0.0001, 0, 0, new Date('2024-01-15T10:01:00Z')),
        ]),
        segment([
          point(0.0002, 0, 0, new Date('2024-01-15T10:02:00Z')), // 1 min, ~10m gap
          point(0.0003, 0, 0, new Date('2024-01-15T10:03:00Z')),
        ]),
      ];

      const result = processSegments(segments);

      expect(result.segments).toHaveLength(1);
      expect(result.segments[0]!.points).toHaveLength(4);
    });

    it('keeps segments separate for large time gaps', () => {
      const segments = [
        segment([
          point(0, 0, 0, new Date('2024-01-15T10:00:00Z')),
          point(0.0001, 0, 0, new Date('2024-01-15T10:01:00Z')),
        ]),
        segment([
          point(0.0002, 0, 0, new Date('2024-01-15T10:30:00Z')), // 29 min gap
          point(0.0003, 0, 0, new Date('2024-01-15T10:31:00Z')),
        ]),
      ];

      const result = processSegments(segments);

      expect(result.segments).toHaveLength(2);
    });

    it('keeps segments separate for large distance gaps', () => {
      const segments = [
        segment([
          point(37.7749, -122.4194, 0, new Date('2024-01-15T10:00:00Z')),
          point(37.775, -122.419, 0, new Date('2024-01-15T10:01:00Z')),
        ]),
        segment([
          point(37.8, -122.4, 0, new Date('2024-01-15T10:02:00Z')), // ~3km gap
          point(37.801, -122.399, 0, new Date('2024-01-15T10:03:00Z')),
        ]),
      ];

      const result = processSegments(segments);

      expect(result.segments).toHaveLength(2);
    });

    it('merges multiple consecutive small-gap segments', () => {
      const segments = [
        segment([point(0, 0, 0, new Date('2024-01-15T10:00:00Z'))]),
        segment([point(0.0001, 0, 0, new Date('2024-01-15T10:01:00Z'))]),
        segment([point(0.0002, 0, 0, new Date('2024-01-15T10:02:00Z'))]),
        segment([point(0.0003, 0, 0, new Date('2024-01-15T10:03:00Z'))]),
      ];

      const result = processSegments(segments);

      expect(result.segments).toHaveLength(1);
      expect(result.segments[0]!.points).toHaveLength(4);
    });
  });

  describe('configurable thresholds', () => {
    it('respects custom time threshold', () => {
      const segments = [
        segment([point(0, 0, 0, new Date('2024-01-15T10:00:00Z'))]),
        segment([
          point(0.0001, 0, 0, new Date('2024-01-15T10:06:00Z')), // 6 min gap
        ]),
      ];

      // Default threshold (5 min) should NOT merge
      const defaultResult = processSegments(segments);
      expect(defaultResult.segments).toHaveLength(2);

      // Custom threshold (10 min) should merge
      const customResult = processSegments(segments, {
        maxTimeGapSeconds: 600,
      });
      expect(customResult.segments).toHaveLength(1);
    });

    it('respects custom distance threshold', () => {
      const segments = [
        segment([point(37.7749, -122.4194, 0, new Date('2024-01-15T10:00:00Z'))]),
        segment([
          point(37.78, -122.415, 0, new Date('2024-01-15T10:01:00Z')), // ~700m gap
        ]),
      ];

      // Default threshold (500m) should NOT merge
      const defaultResult = processSegments(segments);
      expect(defaultResult.segments).toHaveLength(2);

      // Custom threshold (1km) should merge
      const customResult = processSegments(segments, {
        maxDistanceGapKm: 1.0,
      });
      expect(customResult.segments).toHaveLength(1);
    });
  });

  describe('gap metadata', () => {
    it('returns gap analysis information', () => {
      const segments = [
        segment([point(0, 0, 0, new Date('2024-01-15T10:00:00Z'))]),
        segment([
          point(0.001, 0, 0, new Date('2024-01-15T10:10:00Z')), // 10 min gap
        ]),
      ];

      const result = processSegments(segments);

      expect(result.gaps).toHaveLength(1);
      expect(result.gaps[0]!.timeGapSeconds).toBe(600);
      expect(result.gaps[0]!.shouldMerge).toBe(false);
    });

    it('tracks which segments were merged', () => {
      const segments = [
        segment([point(0, 0, 0, new Date('2024-01-15T10:00:00Z'))]),
        segment([point(0.0001, 0, 0, new Date('2024-01-15T10:01:00Z'))]),
        segment([point(0.0002, 0, 0, new Date('2024-01-15T10:30:00Z'))]), // Large gap
        segment([point(0.0003, 0, 0, new Date('2024-01-15T10:31:00Z'))]),
      ];

      const result = processSegments(segments);

      // Should have 2 segments: [0,1] merged and [2,3] merged
      expect(result.segments).toHaveLength(2);
      expect(result.mergeInfo).toBeDefined();
      expect(result.mergeInfo!.mergedCount).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('handles empty input', () => {
      const result = processSegments([]);

      expect(result.segments).toHaveLength(0);
      expect(result.gaps).toHaveLength(0);
    });

    it('handles single segment', () => {
      const segments = [segment([point(0, 0, 0), point(0.001, 0, 0)])];

      const result = processSegments(segments);

      expect(result.segments).toHaveLength(1);
      expect(result.gaps).toHaveLength(0);
    });

    it('handles segments without timestamps', () => {
      const segments = [
        segment([point(0, 0, 0), point(0.001, 0, 0)]),
        segment([point(0.002, 0, 0), point(0.003, 0, 0)]),
      ];

      // Without timestamps, should use distance only
      const result = processSegments(segments);

      expect(result.segments.length).toBeGreaterThanOrEqual(1);
    });
  });
});
