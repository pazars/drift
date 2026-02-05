import { describe, it, expect } from 'vitest';
import { transformCliActivity, calculateCombinedBounds, type CliActivity } from '../transform';

describe('transform', () => {
  describe('transformCliActivity', () => {
    it('converts CLI activity format to web Activity format', () => {
      const cliActivity: CliActivity = {
        id: 'abc123',
        name: 'Morning Run',
        sport: 'running',
        date: '2024-01-15T08:00:00Z',
        distance: 10.5, // km
        duration: 3600,
        movingTime: 3500,
        elevation: {
          gain: 150,
          loss: 140,
          max: 200,
          min: 50,
        },
        bounds: {
          north: 40.0,
          south: 39.9,
          east: -74.0,
          west: -74.1,
        },
        segments: 1,
        pointCount: {
          original: 1000,
          simplified: 100,
        },
        overviewPolyline: 'encoded_polyline_string',
        tags: ['morning', 'easy'],
      };

      const result = transformCliActivity(cliActivity);

      expect(result).toEqual({
        id: 'abc123',
        name: 'Morning Run',
        type: 'run',
        date: '2024-01-15T08:00:00Z',
        distance: 10500, // converted to meters
        duration: 3600,
        elevation: 150,
        polyline: 'encoded_polyline_string',
        bounds: {
          north: 40.0,
          south: 39.9,
          east: -74.0,
          west: -74.1,
        },
        tags: ['morning', 'easy'],
      });
    });

    it('maps running sport type to run', () => {
      const cliActivity: CliActivity = {
        id: '1',
        name: 'Test',
        sport: 'running',
        date: '2024-01-01T00:00:00Z',
        distance: 5,
        duration: 1800,
        movingTime: 1800,
        elevation: { gain: 50, loss: 50, max: 100, min: 50 },
        bounds: { north: 40, south: 39, east: -74, west: -75 },
        segments: 1,
        pointCount: { original: 100, simplified: 50 },
        overviewPolyline: 'abc',
      };

      const result = transformCliActivity(cliActivity);
      expect(result.type).toBe('run');
    });

    it('maps cycling sport type to ride', () => {
      const cliActivity: CliActivity = {
        id: '2',
        name: 'Test',
        sport: 'cycling',
        date: '2024-01-01T00:00:00Z',
        distance: 20,
        duration: 3600,
        movingTime: 3600,
        elevation: { gain: 100, loss: 100, max: 150, min: 50 },
        bounds: { north: 40, south: 39, east: -74, west: -75 },
        segments: 1,
        pointCount: { original: 200, simplified: 100 },
        overviewPolyline: 'def',
      };

      const result = transformCliActivity(cliActivity);
      expect(result.type).toBe('ride');
    });

    it('maps hiking sport type to hike', () => {
      const cliActivity: CliActivity = {
        id: '3',
        name: 'Test',
        sport: 'hiking',
        date: '2024-01-01T00:00:00Z',
        distance: 8,
        duration: 7200,
        movingTime: 7000,
        elevation: { gain: 300, loss: 300, max: 500, min: 200 },
        bounds: { north: 40, south: 39, east: -74, west: -75 },
        segments: 1,
        pointCount: { original: 150, simplified: 75 },
        overviewPolyline: 'ghi',
      };

      const result = transformCliActivity(cliActivity);
      expect(result.type).toBe('hike');
    });

    it('maps walking sport type to walk', () => {
      const cliActivity: CliActivity = {
        id: '4',
        name: 'Test',
        sport: 'walking',
        date: '2024-01-01T00:00:00Z',
        distance: 3,
        duration: 2700,
        movingTime: 2600,
        elevation: { gain: 20, loss: 20, max: 60, min: 40 },
        bounds: { north: 40, south: 39, east: -74, west: -75 },
        segments: 1,
        pointCount: { original: 80, simplified: 40 },
        overviewPolyline: 'jkl',
      };

      const result = transformCliActivity(cliActivity);
      expect(result.type).toBe('walk');
    });

    it('maps swimming sport type to swim', () => {
      const cliActivity: CliActivity = {
        id: '5',
        name: 'Test',
        sport: 'swimming',
        date: '2024-01-01T00:00:00Z',
        distance: 2,
        duration: 3600,
        movingTime: 3500,
        elevation: { gain: 0, loss: 0, max: 0, min: 0 },
        bounds: { north: 40, south: 39, east: -74, west: -75 },
        segments: 1,
        pointCount: { original: 50, simplified: 25 },
        overviewPolyline: 'mno',
      };

      const result = transformCliActivity(cliActivity);
      expect(result.type).toBe('swim');
    });

    it('maps skiing sport type to ski', () => {
      const cliActivity: CliActivity = {
        id: '6',
        name: 'Test',
        sport: 'skiing',
        date: '2024-01-01T00:00:00Z',
        distance: 15,
        duration: 10800,
        movingTime: 10000,
        elevation: { gain: 100, loss: 1500, max: 2000, min: 500 },
        bounds: { north: 47, south: 46, east: 11, west: 10 },
        segments: 5,
        pointCount: { original: 500, simplified: 250 },
        overviewPolyline: 'pqr',
      };

      const result = transformCliActivity(cliActivity);
      expect(result.type).toBe('ski');
    });

    it('maps unknown sport type to other', () => {
      const cliActivity: CliActivity = {
        id: '7',
        name: 'Test',
        sport: 'other',
        date: '2024-01-01T00:00:00Z',
        distance: 5,
        duration: 1800,
        movingTime: 1800,
        elevation: { gain: 50, loss: 50, max: 100, min: 50 },
        bounds: { north: 40, south: 39, east: -74, west: -75 },
        segments: 1,
        pointCount: { original: 100, simplified: 50 },
        overviewPolyline: 'stu',
      };

      const result = transformCliActivity(cliActivity);
      expect(result.type).toBe('other');
    });

    it('handles missing optional fields (tags)', () => {
      const cliActivity: CliActivity = {
        id: '8',
        name: 'Tagless Run',
        sport: 'running',
        date: '2024-01-01T00:00:00Z',
        distance: 5,
        duration: 1800,
        movingTime: 1800,
        elevation: { gain: 50, loss: 50, max: 100, min: 50 },
        bounds: { north: 40, south: 39, east: -74, west: -75 },
        segments: 1,
        pointCount: { original: 100, simplified: 50 },
        overviewPolyline: 'vwx',
      };

      const result = transformCliActivity(cliActivity);
      expect(result.tags).toBeUndefined();
    });

    it('converts distance from km to meters', () => {
      const cliActivity: CliActivity = {
        id: '9',
        name: 'Test',
        sport: 'running',
        date: '2024-01-01T00:00:00Z',
        distance: 5.25, // km
        duration: 1800,
        movingTime: 1800,
        elevation: { gain: 50, loss: 50, max: 100, min: 50 },
        bounds: { north: 40, south: 39, east: -74, west: -75 },
        segments: 1,
        pointCount: { original: 100, simplified: 50 },
        overviewPolyline: 'yz1',
      };

      const result = transformCliActivity(cliActivity);
      expect(result.distance).toBe(5250); // meters
    });

    it('extracts elevation gain from elevation object', () => {
      const cliActivity: CliActivity = {
        id: '10',
        name: 'Test',
        sport: 'running',
        date: '2024-01-01T00:00:00Z',
        distance: 5,
        duration: 1800,
        movingTime: 1800,
        elevation: { gain: 275, loss: 250, max: 300, min: 25 },
        bounds: { north: 40, south: 39, east: -74, west: -75 },
        segments: 1,
        pointCount: { original: 100, simplified: 50 },
        overviewPolyline: '234',
      };

      const result = transformCliActivity(cliActivity);
      expect(result.elevation).toBe(275);
    });
  });

  describe('calculateCombinedBounds', () => {
    it('returns undefined for empty array', () => {
      const result = calculateCombinedBounds([]);
      expect(result).toBeUndefined();
    });

    it('returns undefined when all activities have no bounds', () => {
      const activities = [
        {
          id: '1',
          name: 'A',
          type: 'run' as const,
          date: '2024-01-01',
          distance: 1000,
          duration: 600,
          polyline: 'a',
        },
        {
          id: '2',
          name: 'B',
          type: 'run' as const,
          date: '2024-01-02',
          distance: 2000,
          duration: 1200,
          polyline: 'b',
        },
      ];

      const result = calculateCombinedBounds(activities);
      expect(result).toBeUndefined();
    });

    it('returns bounds of single activity with bounds', () => {
      const activities = [
        {
          id: '1',
          name: 'A',
          type: 'run' as const,
          date: '2024-01-01',
          distance: 1000,
          duration: 600,
          polyline: 'a',
          bounds: { north: 40.5, south: 40.0, east: -73.5, west: -74.0 },
        },
      ];

      const result = calculateCombinedBounds(activities);
      expect(result).toEqual({
        north: 40.5,
        south: 40.0,
        east: -73.5,
        west: -74.0,
      });
    });

    it('calculates correct combined bounds from multiple activities', () => {
      const activities = [
        {
          id: '1',
          name: 'A',
          type: 'run' as const,
          date: '2024-01-01',
          distance: 1000,
          duration: 600,
          polyline: 'a',
          bounds: { north: 40.5, south: 40.0, east: -73.5, west: -74.0 },
        },
        {
          id: '2',
          name: 'B',
          type: 'ride' as const,
          date: '2024-01-02',
          distance: 2000,
          duration: 1200,
          polyline: 'b',
          bounds: { north: 41.0, south: 39.5, east: -73.0, west: -74.5 },
        },
        {
          id: '3',
          name: 'C',
          type: 'hike' as const,
          date: '2024-01-03',
          distance: 3000,
          duration: 1800,
          polyline: 'c',
          bounds: { north: 40.8, south: 40.2, east: -73.2, west: -73.8 },
        },
      ];

      const result = calculateCombinedBounds(activities);
      expect(result).toEqual({
        north: 41.0, // max north
        south: 39.5, // min south
        east: -73.0, // max east (furthest east)
        west: -74.5, // min west (furthest west)
      });
    });

    it('ignores activities without bounds when calculating combined bounds', () => {
      const activities = [
        {
          id: '1',
          name: 'A',
          type: 'run' as const,
          date: '2024-01-01',
          distance: 1000,
          duration: 600,
          polyline: 'a',
          bounds: { north: 40.5, south: 40.0, east: -73.5, west: -74.0 },
        },
        {
          id: '2',
          name: 'B',
          type: 'ride' as const,
          date: '2024-01-02',
          distance: 2000,
          duration: 1200,
          polyline: 'b',
          // no bounds
        },
        {
          id: '3',
          name: 'C',
          type: 'hike' as const,
          date: '2024-01-03',
          distance: 3000,
          duration: 1800,
          polyline: 'c',
          bounds: { north: 41.0, south: 39.5, east: -73.0, west: -74.5 },
        },
      ];

      const result = calculateCombinedBounds(activities);
      expect(result).toEqual({
        north: 41.0,
        south: 39.5,
        east: -73.0,
        west: -74.5,
      });
    });
  });
});
