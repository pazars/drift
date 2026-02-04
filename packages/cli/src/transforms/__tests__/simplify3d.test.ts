import { describe, it, expect } from 'vitest';
import { simplify3D, perpendicularDistance3D } from '../simplify3d';
import type { TrackPoint } from '../../types';

// Helper to create track points
function point(lat: number, lon: number, ele: number, time?: Date): TrackPoint {
  const p: TrackPoint = { lat, lon, ele };
  if (time) p.time = time;
  return p;
}

describe('perpendicularDistance3D', () => {
  it('returns 0 for point on the line', () => {
    const start = point(0, 0, 0);
    const end = point(10, 0, 0);
    const middle = point(5, 0, 0);

    const distance = perpendicularDistance3D(middle, start, end);
    expect(distance).toBeCloseTo(0, 5);
  });

  it('calculates horizontal perpendicular distance', () => {
    const start = point(0, 0, 0);
    const end = point(10, 0, 0);
    const offLine = point(5, 1, 0); // 1 degree off the line

    const distance = perpendicularDistance3D(offLine, start, end);
    expect(distance).toBeGreaterThan(0);
  });

  it('includes elevation in distance calculation', () => {
    const start = point(0, 0, 0);
    const end = point(10, 0, 0);
    const elevated = point(5, 0, 100); // On line horizontally but elevated

    const distance = perpendicularDistance3D(elevated, start, end, 1.0);
    expect(distance).toBeGreaterThan(0);
  });

  it('respects elevation weight parameter', () => {
    const start = point(0, 0, 0);
    const end = point(10, 0, 0);
    const elevated = point(5, 0, 100);

    const distLowWeight = perpendicularDistance3D(elevated, start, end, 0.1);
    const distHighWeight = perpendicularDistance3D(elevated, start, end, 1.0);

    expect(distHighWeight).toBeGreaterThan(distLowWeight);
  });
});

describe('simplify3D', () => {
  describe('edge cases', () => {
    it('returns empty array for empty input', () => {
      const result = simplify3D([], 0.0001);
      expect(result).toEqual([]);
    });

    it('returns single point for single point input', () => {
      const points = [point(0, 0, 0)];
      const result = simplify3D(points, 0.0001);
      expect(result).toHaveLength(1);
    });

    it('returns both points for two point input', () => {
      const points = [point(0, 0, 0), point(10, 10, 100)];
      const result = simplify3D(points, 0.0001);
      expect(result).toHaveLength(2);
    });
  });

  describe('simplification behavior', () => {
    it('keeps first and last points', () => {
      const points = [
        point(0, 0, 0),
        point(1, 0.0001, 1),
        point(2, 0.0002, 2),
        point(3, 0.0003, 3),
        point(4, 0, 4),
      ];

      const result = simplify3D(points, 0.001);

      expect(result[0]).toEqual(points[0]);
      expect(result[result.length - 1]).toEqual(points[points.length - 1]);
    });

    it('removes collinear points', () => {
      // Points in a straight line should reduce to just start and end
      const points = [
        point(0, 0, 0),
        point(1, 0, 10),
        point(2, 0, 20),
        point(3, 0, 30),
        point(4, 0, 40),
      ];

      const result = simplify3D(points, 0.0001);

      // With low tolerance, collinear points should be removed
      expect(result.length).toBeLessThan(points.length);
      expect(result).toContain(points[0]);
      expect(result).toContain(points[4]);
    });

    it('preserves significant elevation changes', () => {
      // Points with large horizontal spacing and significant elevation spike
      const points = [
        point(0, 0, 0),
        point(0.001, 0, 0),
        point(0.002, 0, 500), // Significant elevation spike (500m)
        point(0.003, 0, 0),
        point(0.004, 0, 0),
      ];

      // Use high elevation weight to ensure elevation is considered
      const result = simplify3D(points, 0.00001, 5.0);

      // The elevation spike should be preserved
      const hasElevationSpike = result.some((p) => p.ele === 500);
      expect(hasElevationSpike).toBe(true);
    });

    it('reduces point count significantly', () => {
      // Create a track with many points that mostly follow a straight line
      const points: TrackPoint[] = [];
      for (let i = 0; i <= 100; i++) {
        // Add small random deviation to simulate GPS noise
        const noise = Math.sin(i * 0.1) * 0.00001;
        points.push(point(i * 0.001, noise, i));
      }

      const result = simplify3D(points, 0.0001);

      // Should significantly reduce points (70-90% reduction typical)
      expect(result.length).toBeLessThan(points.length * 0.5);
      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('tolerance parameter', () => {
    it('higher tolerance removes more points', () => {
      const points = [
        point(0, 0, 0),
        point(1, 0.001, 10),
        point(2, 0.002, 20),
        point(3, 0.001, 30),
        point(4, 0, 40),
      ];

      const lowTolerance = simplify3D(points, 0.0001);
      const highTolerance = simplify3D(points, 0.01);

      expect(highTolerance.length).toBeLessThanOrEqual(lowTolerance.length);
    });

    it('zero tolerance keeps all points', () => {
      const points = [point(0, 0, 0), point(1, 0.001, 10), point(2, 0, 20)];

      const result = simplify3D(points, 0);

      expect(result.length).toBe(points.length);
    });
  });

  describe('elevation weight parameter', () => {
    it('higher weight preserves more elevation detail', () => {
      const points: TrackPoint[] = [];
      for (let i = 0; i <= 50; i++) {
        // Elevation varies while horizontal is mostly straight
        const ele = Math.sin(i * 0.2) * 50;
        points.push(point(i * 0.001, 0, ele));
      }

      const lowWeight = simplify3D(points, 0.0001, 0.1);
      const highWeight = simplify3D(points, 0.0001, 2.0);

      // Higher elevation weight should keep more points to preserve elevation detail
      expect(highWeight.length).toBeGreaterThanOrEqual(lowWeight.length);
    });
  });

  describe('preserves point properties', () => {
    it('preserves timestamps on kept points', () => {
      const baseTime = new Date('2024-01-15T10:00:00Z');
      const points = [
        point(0, 0, 0, new Date(baseTime.getTime())),
        point(1, 0.01, 10, new Date(baseTime.getTime() + 60000)),
        point(2, 0, 20, new Date(baseTime.getTime() + 120000)),
      ];

      const result = simplify3D(points, 0.0001);

      for (const p of result) {
        expect(p.time).toBeInstanceOf(Date);
      }
    });

    it('preserves extensions on kept points', () => {
      const points: TrackPoint[] = [
        { lat: 0, lon: 0, ele: 0, extensions: { heartRate: 100 } },
        { lat: 1, lon: 0.01, ele: 10, extensions: { heartRate: 110 } },
        { lat: 2, lon: 0, ele: 20, extensions: { heartRate: 120 } },
      ];

      const result = simplify3D(points, 0.0001);

      for (const p of result) {
        expect(p.extensions).toBeDefined();
      }
    });
  });

  describe('performance', () => {
    it('handles 10k+ points in reasonable time', () => {
      const points: TrackPoint[] = [];
      for (let i = 0; i < 10000; i++) {
        const noise = Math.sin(i * 0.01) * 0.0001;
        points.push(point(37 + i * 0.0001, -122 + noise, i % 100));
      }

      const start = performance.now();
      const result = simplify3D(points, 0.00001);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(1000); // Should complete in under 1 second
      expect(result.length).toBeLessThan(points.length);
    });
  });
});
