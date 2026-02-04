import { describe, it, expect } from 'vitest';
import { createHeatmapLayer } from './HeatmapLayer';

describe('createHeatmapLayer', () => {
  const mockPoints = [
    { position: [-73.5, 45.5] as [number, number], weight: 1 },
    { position: [-73.6, 45.6] as [number, number], weight: 1 },
    { position: [-73.55, 45.55] as [number, number], weight: 1 },
  ];

  it('creates a layer with correct id', () => {
    const layer = createHeatmapLayer({ points: mockPoints });

    expect(layer).not.toBeNull();
    expect(layer!.id).toBe('heatmap-layer');
  });

  it('accepts custom id', () => {
    const layer = createHeatmapLayer({ points: mockPoints, id: 'custom-heatmap' });

    expect(layer).not.toBeNull();
    expect(layer!.id).toBe('custom-heatmap');
  });

  it('passes points as data', () => {
    const layer = createHeatmapLayer({ points: mockPoints });

    expect(layer).not.toBeNull();
    expect(layer!.props.data).toBe(mockPoints);
  });

  it('uses default radius when not specified', () => {
    const layer = createHeatmapLayer({ points: mockPoints });

    expect(layer).not.toBeNull();
    expect(layer!.props.radiusPixels).toBe(30);
  });

  it('accepts custom radius', () => {
    const layer = createHeatmapLayer({ points: mockPoints, radiusPixels: 50 });

    expect(layer).not.toBeNull();
    expect(layer!.props.radiusPixels).toBe(50);
  });

  it('uses default intensity when not specified', () => {
    const layer = createHeatmapLayer({ points: mockPoints });

    expect(layer).not.toBeNull();
    expect(layer!.props.intensity).toBe(1);
  });

  it('accepts custom intensity', () => {
    const layer = createHeatmapLayer({ points: mockPoints, intensity: 2 });

    expect(layer).not.toBeNull();
    expect(layer!.props.intensity).toBe(2);
  });

  it('returns null when points array is empty', () => {
    const layer = createHeatmapLayer({ points: [] });

    expect(layer).toBeNull();
  });

  it('has getPosition accessor', () => {
    const layer = createHeatmapLayer({ points: mockPoints });

    expect(layer).not.toBeNull();
    expect(layer!.props.getPosition).toBeDefined();
  });

  it('has getWeight accessor', () => {
    const layer = createHeatmapLayer({ points: mockPoints });

    expect(layer).not.toBeNull();
    expect(layer!.props.getWeight).toBeDefined();
  });
});
