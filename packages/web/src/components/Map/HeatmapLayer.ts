import { HeatmapLayer } from '@deck.gl/aggregation-layers';

export interface HeatmapPoint {
  position: [number, number];
  weight: number;
}

export interface CreateHeatmapLayerOptions {
  points: HeatmapPoint[];
  id?: string;
  radiusPixels?: number;
  intensity?: number;
  threshold?: number;
}

export function createHeatmapLayer(
  options: CreateHeatmapLayerOptions
): HeatmapLayer<HeatmapPoint> | null {
  const {
    points,
    id = 'heatmap-layer',
    radiusPixels = 30,
    intensity = 1,
    threshold = 0.05,
  } = options;

  if (points.length === 0) {
    return null;
  }

  return new HeatmapLayer({
    id,
    data: points,
    getPosition: (d: HeatmapPoint) => d.position,
    getWeight: (d: HeatmapPoint) => d.weight,
    radiusPixels,
    intensity,
    threshold,
    colorRange: [
      [255, 255, 178, 25],
      [254, 217, 118, 85],
      [254, 178, 76, 127],
      [253, 141, 60, 170],
      [252, 78, 42, 212],
      [227, 26, 28, 255],
    ],
  });
}
