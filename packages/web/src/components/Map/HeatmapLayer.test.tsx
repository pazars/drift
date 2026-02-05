import { describe, it, expect, vi } from 'vitest';
import { createHeatmapLayers } from './HeatmapLayer';
import type { Activity } from '../../types';

// Mock flexpolyline decoding
vi.mock('@here/flexpolyline', () => ({
  decode: vi.fn(() => ({
    polyline: [
      [37.7749, -122.4194],
      [37.775, -122.4195],
    ],
  })),
}));

const mockActivities: Activity[] = [
  {
    id: 'activity-1',
    name: 'Morning Run',
    type: 'run',
    date: '2024-01-15T08:00:00Z',
    distance: 5000,
    duration: 1800,
    polyline: 'encoded_polyline_1',
  },
  {
    id: 'activity-2',
    name: 'Evening Ride',
    type: 'ride',
    date: '2024-01-16T18:00:00Z',
    distance: 25000,
    duration: 3600,
    polyline: 'encoded_polyline_2',
  },
];

describe('createHeatmapLayers', () => {
  it('returns empty array for empty activities', () => {
    const layers = createHeatmapLayers({ activities: [] });
    expect(layers).toEqual([]);
  });

  it('creates a PathLayer for each activity', () => {
    const layers = createHeatmapLayers({ activities: mockActivities });
    expect(layers).toHaveLength(2);
  });

  it('uses activity id in layer id', () => {
    const layers = createHeatmapLayers({ activities: mockActivities });
    expect(layers[0]?.id).toContain('activity-1');
    expect(layers[1]?.id).toContain('activity-2');
  });

  it('accepts custom id prefix', () => {
    const layers = createHeatmapLayers({ activities: mockActivities, id: 'custom' });
    expect(layers[0]?.id).toContain('custom');
  });

  it('uses default line width when not specified', () => {
    const layers = createHeatmapLayers({ activities: mockActivities });
    expect(layers).toHaveLength(2);
    // Default lineWidthPixels is 3
  });

  it('accepts custom line width', () => {
    const layers = createHeatmapLayers({
      activities: mockActivities,
      lineWidthPixels: 5,
    });
    expect(layers).toHaveLength(2);
  });

  it('creates layers with rounded caps and joints', () => {
    const layers = createHeatmapLayers({ activities: mockActivities });
    expect(layers[0]?.props.capRounded).toBe(true);
    expect(layers[0]?.props.jointRounded).toBe(true);
  });

  it('creates non-pickable layers for performance', () => {
    const layers = createHeatmapLayers({ activities: mockActivities });
    expect(layers[0]?.props.pickable).toBe(false);
  });
});
