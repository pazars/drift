import { describe, it, expect } from 'vitest';
import { parseGPX } from '../gpx';
import { loadFixture, FIXTURES } from '../../test-utils/fixtures';

describe('parseGPX', () => {
  describe('valid GPX files', () => {
    it('parses a single-segment GPX file', () => {
      const gpxContent = loadFixture(FIXTURES.VALID_SINGLE_SEGMENT);
      const result = parseGPX(gpxContent);

      expect(result.track.name).toBe('Morning Ride');
      expect(result.track.segments).toHaveLength(1);
      expect(result.track.segments[0]!.points.length).toBeGreaterThan(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('parses a multi-segment GPX file', () => {
      const gpxContent = loadFixture(FIXTURES.VALID_MULTI_SEGMENT);
      const result = parseGPX(gpxContent);

      expect(result.track.segments).toHaveLength(3);
      expect(result.track.segments[0]!.points.length).toBeGreaterThan(0);
      expect(result.track.segments[1]!.points.length).toBeGreaterThan(0);
      expect(result.track.segments[2]!.points.length).toBeGreaterThan(0);
    });

    it('extracts 3D coordinates (lon, lat, ele)', () => {
      const gpxContent = loadFixture(FIXTURES.VALID_SINGLE_SEGMENT);
      const result = parseGPX(gpxContent);

      const point = result.track.segments[0]!.points[0]!;
      expect(point).toHaveProperty('lon');
      expect(point).toHaveProperty('lat');
      expect(point).toHaveProperty('ele');
      expect(typeof point.lon).toBe('number');
      expect(typeof point.lat).toBe('number');
      expect(typeof point.ele).toBe('number');
    });

    it('extracts track name and type', () => {
      const gpxContent = loadFixture(FIXTURES.VALID_SINGLE_SEGMENT);
      const result = parseGPX(gpxContent);

      expect(result.track.name).toBe('Morning Ride');
      expect(result.track.type).toBe('cycling');
    });

    it('extracts timestamps when present', () => {
      const gpxContent = loadFixture(FIXTURES.VALID_SINGLE_SEGMENT);
      const result = parseGPX(gpxContent);

      const point = result.track.segments[0]!.points[0]!;
      expect(point.time).toBeInstanceOf(Date);
    });
  });

  describe('missing data handling', () => {
    it('returns warning for missing elevation data', () => {
      const gpxContent = loadFixture(FIXTURES.MISSING_ELEVATION);
      const result = parseGPX(gpxContent);

      expect(result.warnings).toContainEqual(expect.stringContaining('elevation'));
      // Should still parse points without elevation
      expect(result.track.segments[0]!.points.length).toBeGreaterThan(0);
    });

    it('returns warning for missing timestamps', () => {
      const gpxContent = loadFixture(FIXTURES.MISSING_TIMESTAMPS);
      const result = parseGPX(gpxContent);

      expect(result.warnings).toContainEqual(expect.stringContaining('timestamp'));
      // Points should not have time property
      const point = result.track.segments[0]!.points[0]!;
      expect(point.time).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('throws on corrupted XML', () => {
      // Completely malformed XML that cannot be parsed
      const malformedXml = '<<<not valid xml at all>>>';

      expect(() => parseGPX(malformedXml)).toThrow();
    });

    it('throws on empty track', () => {
      const gpxContent = loadFixture(FIXTURES.EMPTY_TRACK);

      expect(() => parseGPX(gpxContent)).toThrow(/no track/i);
    });
  });

  describe('extension handling', () => {
    it('extracts Garmin extension data', () => {
      const gpxContent = loadFixture(FIXTURES.GARMIN_EXTENSIONS);
      const result = parseGPX(gpxContent);

      const point = result.track.segments[0]!.points[0]!;
      expect(point.extensions).toBeDefined();
      expect(point.extensions?.heartRate).toBe(120);
      expect(point.extensions?.cadence).toBe(85);
    });

    it('handles Strava export format', () => {
      const gpxContent = loadFixture(FIXTURES.STRAVA_EXPORT);
      const result = parseGPX(gpxContent);

      expect(result.track.name).toBeTruthy();
      expect(result.track.segments[0]!.points.length).toBeGreaterThan(0);
    });
  });
});
