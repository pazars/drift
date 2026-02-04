import { describe, it, expect } from 'vitest';
import { calculateMetadata } from '../metadata';
import { parseGPX } from '../gpx';
import { loadFixture, FIXTURES } from '../../test-utils/fixtures';
import type { ParsedTrack } from '../../types';

describe('calculateMetadata', () => {
  describe('distance calculation', () => {
    it('calculates total distance from track points', () => {
      const gpxContent = loadFixture(FIXTURES.VALID_SINGLE_SEGMENT);
      const { track } = parseGPX(gpxContent);
      const metadata = calculateMetadata(track);

      // Distance should be positive and reasonable for the test track
      expect(metadata.distance).toBeGreaterThan(0);
      expect(metadata.distance).toBeLessThan(100); // Less than 100km for test data
    });

    it('calculates distance across multiple segments', () => {
      const gpxContent = loadFixture(FIXTURES.VALID_MULTI_SEGMENT);
      const { track } = parseGPX(gpxContent);
      const metadata = calculateMetadata(track);

      expect(metadata.distance).toBeGreaterThan(0);
    });

    it('returns 0 distance for single point', () => {
      const track: ParsedTrack = {
        name: 'Single Point',
        segments: [
          {
            points: [{ lat: 37.7749, lon: -122.4194, ele: 10 }],
          },
        ],
      };

      const metadata = calculateMetadata(track);
      expect(metadata.distance).toBe(0);
    });
  });

  describe('duration calculation', () => {
    it('calculates duration from timestamps', () => {
      const gpxContent = loadFixture(FIXTURES.VALID_SINGLE_SEGMENT);
      const { track } = parseGPX(gpxContent);
      const metadata = calculateMetadata(track);

      // Duration should be positive (test track has timestamps)
      expect(metadata.duration).toBeGreaterThan(0);
    });

    it('returns 0 duration when no timestamps', () => {
      const gpxContent = loadFixture(FIXTURES.MISSING_TIMESTAMPS);
      const { track } = parseGPX(gpxContent);
      const metadata = calculateMetadata(track);

      expect(metadata.duration).toBe(0);
    });
  });

  describe('moving time calculation', () => {
    it('calculates moving time excluding pauses', () => {
      const gpxContent = loadFixture(FIXTURES.VALID_SINGLE_SEGMENT);
      const { track } = parseGPX(gpxContent);
      const metadata = calculateMetadata(track);

      // Moving time should be less than or equal to duration
      expect(metadata.movingTime).toBeLessThanOrEqual(metadata.duration);
      expect(metadata.movingTime).toBeGreaterThan(0);
    });

    it('excludes long pauses from moving time', () => {
      // Create a track with a 10-minute pause in the middle
      const track: ParsedTrack = {
        name: 'Track with pause',
        segments: [
          {
            points: [
              {
                lat: 37.7749,
                lon: -122.4194,
                ele: 10,
                time: new Date('2024-01-15T10:00:00Z'),
              },
              {
                lat: 37.775,
                lon: -122.418,
                ele: 15,
                time: new Date('2024-01-15T10:01:00Z'),
              },
              // 10-minute pause (should be excluded from moving time)
              {
                lat: 37.7751,
                lon: -122.417,
                ele: 20,
                time: new Date('2024-01-15T10:11:00Z'),
              },
              {
                lat: 37.7752,
                lon: -122.416,
                ele: 25,
                time: new Date('2024-01-15T10:12:00Z'),
              },
            ],
          },
        ],
      };

      const metadata = calculateMetadata(track);

      // Total duration: 12 minutes (720 seconds)
      // Moving time: ~2 minutes (pause excluded)
      expect(metadata.duration).toBe(720);
      expect(metadata.movingTime).toBeLessThan(metadata.duration);
      expect(metadata.movingTime).toBeGreaterThan(0);
    });
  });

  describe('elevation stats', () => {
    it('calculates elevation gain and loss', () => {
      const gpxContent = loadFixture(FIXTURES.VALID_SINGLE_SEGMENT);
      const { track } = parseGPX(gpxContent);
      const metadata = calculateMetadata(track);

      expect(metadata.elevation.gain).toBeGreaterThanOrEqual(0);
      expect(metadata.elevation.loss).toBeGreaterThanOrEqual(0);
    });

    it('calculates min and max elevation', () => {
      const gpxContent = loadFixture(FIXTURES.VALID_SINGLE_SEGMENT);
      const { track } = parseGPX(gpxContent);
      const metadata = calculateMetadata(track);

      expect(metadata.elevation.min).toBeLessThanOrEqual(metadata.elevation.max);
    });

    it('filters noise with threshold', () => {
      // Create a track with small elevation fluctuations that should be filtered
      const track: ParsedTrack = {
        name: 'Noisy elevation',
        segments: [
          {
            points: [
              { lat: 37.7749, lon: -122.4194, ele: 100 },
              { lat: 37.775, lon: -122.418, ele: 101 }, // +1m (noise)
              { lat: 37.7751, lon: -122.417, ele: 100 }, // -1m (noise)
              { lat: 37.7752, lon: -122.416, ele: 110 }, // +10m (real gain)
              { lat: 37.7753, lon: -122.415, ele: 105 }, // -5m (real loss)
            ],
          },
        ],
      };

      const metadata = calculateMetadata(track);

      // With default threshold of 2m, small fluctuations should be filtered
      // Only the +10m and -5m should count
      expect(metadata.elevation.gain).toBeGreaterThanOrEqual(8);
      expect(metadata.elevation.gain).toBeLessThanOrEqual(12);
    });

    it('handles missing elevation data', () => {
      const gpxContent = loadFixture(FIXTURES.MISSING_ELEVATION);
      const { track } = parseGPX(gpxContent);
      const metadata = calculateMetadata(track);

      // Should have zeros or minimal values when no elevation data
      expect(metadata.elevation.gain).toBe(0);
      expect(metadata.elevation.loss).toBe(0);
    });
  });

  describe('bounding box', () => {
    it('calculates correct bounding box', () => {
      const gpxContent = loadFixture(FIXTURES.VALID_SINGLE_SEGMENT);
      const { track } = parseGPX(gpxContent);
      const metadata = calculateMetadata(track);

      expect(metadata.bounds.north).toBeGreaterThanOrEqual(metadata.bounds.south);
      expect(metadata.bounds.east).toBeGreaterThanOrEqual(metadata.bounds.west);
    });

    it('includes all points in bounding box', () => {
      const track: ParsedTrack = {
        name: 'Test bounds',
        segments: [
          {
            points: [
              { lat: 37.0, lon: -123.0, ele: 10 },
              { lat: 38.0, lon: -122.0, ele: 20 },
              { lat: 37.5, lon: -122.5, ele: 15 },
            ],
          },
        ],
      };

      const metadata = calculateMetadata(track);

      expect(metadata.bounds.north).toBe(38.0);
      expect(metadata.bounds.south).toBe(37.0);
      expect(metadata.bounds.east).toBe(-122.0);
      expect(metadata.bounds.west).toBe(-123.0);
    });
  });

  describe('point count', () => {
    it('tracks original point count', () => {
      const gpxContent = loadFixture(FIXTURES.VALID_SINGLE_SEGMENT);
      const { track } = parseGPX(gpxContent);
      const metadata = calculateMetadata(track);

      expect(metadata.pointCount.original).toBeGreaterThan(0);
      expect(metadata.pointCount.simplified).toBe(metadata.pointCount.original);
    });

    it('counts points across all segments', () => {
      const gpxContent = loadFixture(FIXTURES.VALID_MULTI_SEGMENT);
      const { track } = parseGPX(gpxContent);
      const metadata = calculateMetadata(track);

      // Multi-segment track should have multiple points
      expect(metadata.pointCount.original).toBeGreaterThan(3);
    });
  });

  describe('segment count', () => {
    it('counts segments correctly', () => {
      const gpxContent = loadFixture(FIXTURES.VALID_MULTI_SEGMENT);
      const { track } = parseGPX(gpxContent);
      const metadata = calculateMetadata(track);

      expect(metadata.segments).toBe(3);
    });
  });
});
