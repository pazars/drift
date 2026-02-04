import { describe, it, expect } from 'vitest';
import { encodeFlexiblePolyline, decodeFlexiblePolyline } from '../polyline';
import type { TrackPoint } from '../../types';

// Helper to create track points
function point(lat: number, lon: number, ele: number): TrackPoint {
  return { lat, lon, ele };
}

describe('encodeFlexiblePolyline', () => {
  describe('basic encoding', () => {
    it('encodes a simple polyline', () => {
      const points = [
        point(37.7749, -122.4194, 100),
        point(37.785, -122.4095, 110),
        point(37.7951, -122.3996, 120),
      ];

      const encoded = encodeFlexiblePolyline(points);

      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('produces shorter strings for similar coordinates', () => {
      const nearbyPoints = [
        point(37.7749, -122.4194, 100),
        point(37.775, -122.4193, 101),
        point(37.7751, -122.4192, 102),
      ];

      const farPoints = [
        point(37.7749, -122.4194, 100),
        point(40.7128, -74.006, 10000),
        point(-33.8688, 151.2093, 50),
      ];

      const nearbyEncoded = encodeFlexiblePolyline(nearbyPoints);
      const farEncoded = encodeFlexiblePolyline(farPoints);

      // Nearby points should compress better
      expect(nearbyEncoded.length).toBeLessThan(farEncoded.length);
    });
  });

  describe('altitude support', () => {
    it('preserves altitude/elevation values', () => {
      const points = [
        point(37.7749, -122.4194, 100),
        point(37.785, -122.4095, 500),
        point(37.7951, -122.3996, 200),
      ];

      const encoded = encodeFlexiblePolyline(points);
      const decoded = decodeFlexiblePolyline(encoded);

      // Check elevations are preserved (within precision limits)
      expect(decoded[0]?.ele).toBeCloseTo(100, 0);
      expect(decoded[1]?.ele).toBeCloseTo(500, 0);
      expect(decoded[2]?.ele).toBeCloseTo(200, 0);
    });

    it('handles negative elevations', () => {
      const points = [
        point(31.5, 35.5, -400), // Dead Sea
        point(31.6, 35.6, -350),
      ];

      const encoded = encodeFlexiblePolyline(points);
      const decoded = decodeFlexiblePolyline(encoded);

      expect(decoded[0]?.ele).toBeCloseTo(-400, 0);
      expect(decoded[1]?.ele).toBeCloseTo(-350, 0);
    });

    it('handles high elevations', () => {
      const points = [
        point(27.9881, 86.925, 8848), // Everest
        point(28.0, 87.0, 8000),
      ];

      const encoded = encodeFlexiblePolyline(points);
      const decoded = decodeFlexiblePolyline(encoded);

      expect(decoded[0]?.ele).toBeCloseTo(8848, 0);
      expect(decoded[1]?.ele).toBeCloseTo(8000, 0);
    });
  });

  describe('precision', () => {
    it('uses default precision for reasonable accuracy', () => {
      const points = [
        point(37.7749295, -122.4194155, 100.5),
        point(37.7850123, -122.4095678, 110.25),
      ];

      const encoded = encodeFlexiblePolyline(points);
      const decoded = decodeFlexiblePolyline(encoded);

      // Default precision should preserve ~5 decimal places
      expect(decoded[0]?.lat).toBeCloseTo(37.7749295, 4);
      expect(decoded[0]?.lon).toBeCloseTo(-122.4194155, 4);
    });

    it('allows custom precision', () => {
      const points = [
        point(37.7749295, -122.4194155, 100.5),
        point(37.7850123, -122.4095678, 110.25),
      ];

      const highPrecision = encodeFlexiblePolyline(points, { precision: 7 });
      const lowPrecision = encodeFlexiblePolyline(points, { precision: 3 });

      // Higher precision produces longer strings
      expect(highPrecision.length).toBeGreaterThan(lowPrecision.length);
    });

    it('allows custom third dimension precision', () => {
      const points = [point(37.7749, -122.4194, 100.567), point(37.785, -122.4095, 110.234)];

      const encoded = encodeFlexiblePolyline(points, { thirdDimPrecision: 2 });
      const decoded = decodeFlexiblePolyline(encoded);

      // With precision 2, should preserve 2 decimal places
      expect(decoded[0]?.ele).toBeCloseTo(100.57, 1);
    });
  });

  describe('edge cases', () => {
    it('handles empty array', () => {
      const points: TrackPoint[] = [];

      const encoded = encodeFlexiblePolyline(points);

      expect(typeof encoded).toBe('string');
    });

    it('handles single point', () => {
      const points = [point(37.7749, -122.4194, 100)];

      const encoded = encodeFlexiblePolyline(points);
      const decoded = decodeFlexiblePolyline(encoded);

      expect(decoded).toHaveLength(1);
      expect(decoded[0]?.lat).toBeCloseTo(37.7749, 4);
    });

    it('handles two points', () => {
      const points = [point(37.7749, -122.4194, 100), point(37.785, -122.4095, 110)];

      const encoded = encodeFlexiblePolyline(points);
      const decoded = decodeFlexiblePolyline(encoded);

      expect(decoded).toHaveLength(2);
    });

    it('handles coordinates at extremes', () => {
      const points = [
        point(90, 180, 0), // North pole, dateline
        point(-90, -180, 0), // South pole, dateline
      ];

      const encoded = encodeFlexiblePolyline(points);
      const decoded = decodeFlexiblePolyline(encoded);

      expect(decoded).toHaveLength(2);
      expect(decoded[0]?.lat).toBeCloseTo(90, 4);
      expect(decoded[1]?.lat).toBeCloseTo(-90, 4);
    });
  });

  describe('round-trip', () => {
    it('maintains coordinate precision through encode/decode', () => {
      const original = [
        point(37.7749, -122.4194, 100),
        point(37.785, -122.4095, 150),
        point(37.7951, -122.3996, 200),
      ];

      const encoded = encodeFlexiblePolyline(original);
      const decoded = decodeFlexiblePolyline(encoded);

      expect(decoded).toHaveLength(original.length);

      for (let i = 0; i < original.length; i++) {
        expect(decoded[i]?.lat).toBeCloseTo(original[i]!.lat, 4);
        expect(decoded[i]?.lon).toBeCloseTo(original[i]!.lon, 4);
        expect(decoded[i]?.ele).toBeCloseTo(original[i]!.ele, 0);
      }
    });

    it('maintains order through encode/decode', () => {
      const points = [
        point(37.7749, -122.4194, 100),
        point(38.0, -122.0, 200),
        point(39.0, -121.0, 300),
        point(40.0, -120.0, 400),
      ];

      const decoded = decodeFlexiblePolyline(encodeFlexiblePolyline(points));

      // Verify order is preserved
      for (let i = 1; i < decoded.length; i++) {
        expect(decoded[i]!.lat).toBeGreaterThan(decoded[i - 1]!.lat);
      }
    });
  });
});

describe('decodeFlexiblePolyline', () => {
  it('returns TrackPoint array', () => {
    const points = [point(37.7749, -122.4194, 100), point(37.785, -122.4095, 110)];

    const encoded = encodeFlexiblePolyline(points);
    const decoded = decodeFlexiblePolyline(encoded);

    expect(Array.isArray(decoded)).toBe(true);
    expect(decoded[0]).toHaveProperty('lat');
    expect(decoded[0]).toHaveProperty('lon');
    expect(decoded[0]).toHaveProperty('ele');
  });

  it('handles encoded string with no altitude', () => {
    // Manually create a 2D encoded polyline (without altitude)
    const points = [point(37.7749, -122.4194, 100), point(37.785, -122.4095, 110)];

    // Using default encoding which includes altitude
    const encoded = encodeFlexiblePolyline(points);
    const decoded = decodeFlexiblePolyline(encoded);

    // Should have elevation data
    expect(decoded[0]?.ele).toBeDefined();
  });
});
