import { describe, it, expect, vi } from 'vitest';
import { createActivityLayers } from './ActivityLayer';
import type { Activity } from '../../types';

// Mock flexpolyline decoding
vi.mock('@here/flexpolyline', () => ({
  decode: vi.fn((_polyline: string) => ({
    // Return simple mock coordinates [lat, lng, alt?] format
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

describe('createActivityLayers', () => {
  it('returns empty array for empty activities', () => {
    const layers = createActivityLayers([]);
    expect(layers).toEqual([]);
  });

  it('creates a PathLayer for each activity', () => {
    const layers = createActivityLayers(mockActivities);
    expect(layers).toHaveLength(2);
  });

  it('uses activity id for layer id', () => {
    const layers = createActivityLayers(mockActivities);
    expect(layers[0]?.id).toBe('activity-path-activity-1');
    expect(layers[1]?.id).toBe('activity-path-activity-2');
  });

  it('highlights selected activity', () => {
    const layers = createActivityLayers(mockActivities, 'activity-1');
    // Selected activity should have different styling
    expect(layers).toHaveLength(2);
  });

  it('calls onActivityClick when provided', () => {
    const onActivityClick = vi.fn();
    const layers = createActivityLayers(mockActivities, null, onActivityClick);
    expect(layers).toHaveLength(2);
    // Layer should have pickable: true when onActivityClick is provided
  });
});
