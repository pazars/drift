import { PathLayer } from '@deck.gl/layers';
import { decode } from '@here/flexpolyline';
import type { Activity } from '../../types';

export interface HeatmapPoint {
  position: [number, number];
  weight: number;
}

interface PathData {
  path: [number, number][];
  activity: Activity;
}

// Orange color that matches the legend gradient and is visible on maps
const HEATMAP_COLOR: [number, number, number, number] = [234, 88, 12, 160];

/**
 * Decode Flexible Polyline and convert to deck.gl path format [lng, lat].
 */
function decodePolyline(encoded: string): [number, number][] {
  const result = decode(encoded);
  return result.polyline.map(([lat, lng]) => [lng, lat] as [number, number]);
}

export interface CreateHeatmapLayerOptions {
  activities: Activity[];
  id?: string;
  lineWidthPixels?: number;
}

/**
 * Create a line-based heatmap layer showing activity tracks.
 * Uses PathLayer with semi-transparent lines that blend where they overlap,
 * creating a natural intensity visualization.
 */
export function createHeatmapLayers(options: CreateHeatmapLayerOptions): PathLayer<PathData>[] {
  const { activities, id = 'heatmap', lineWidthPixels = 3 } = options;

  if (activities.length === 0) {
    return [];
  }

  return activities.map((activity, index) => {
    const path = decodePolyline(activity.polyline);

    return new PathLayer<PathData>({
      id: `${id}-${activity.id}-${index}`,
      data: [{ path, activity }],
      getPath: (d) => d.path,
      getColor: () => HEATMAP_COLOR,
      getWidth: () => lineWidthPixels,
      widthUnits: 'pixels',
      capRounded: true,
      jointRounded: true,
      // Disable picking for better performance
      pickable: false,
    });
  });
}

// Legacy export for backwards compatibility
export interface CreateHeatmapLayerLegacyOptions {
  points: HeatmapPoint[];
  id?: string;
  radiusPixels?: number;
  intensity?: number;
  threshold?: number;
}

/**
 * @deprecated Use createHeatmapLayers instead
 */
export function createHeatmapLayer(_options: CreateHeatmapLayerLegacyOptions): null {
  // Return null - this function is deprecated
  return null;
}
