import { PathLayer } from '@deck.gl/layers';
import { decode } from '@here/flexpolyline';
import type { Activity } from '../../types';
import { getActivityColorRGB } from '../../utils/colors';

// Line widths in meters for zoom-based scaling
const DEFAULT_LINE_WIDTH_METERS = 4;
const SELECTED_LINE_WIDTH_METERS = 6;
const DEFAULT_OPACITY = 200;
const UNSELECTED_OPACITY = 150;

interface PathData {
  path: [number, number][];
  activity: Activity;
}

/**
 * Decode Flexible Polyline and convert to deck.gl path format [lng, lat].
 */
function decodePolyline(encoded: string): [number, number][] {
  const result = decode(encoded);
  // Flexible Polyline returns { polyline: [[lat, lng, alt?], ...] }
  return result.polyline.map(([lat, lng]) => [lng, lat] as [number, number]);
}

/**
 * Create deck.gl PathLayers for displaying activity tracks.
 */
export function createActivityLayers(
  activities: Activity[],
  selectedActivityId?: string | null,
  onActivityClick?: (activity: Activity) => void
): PathLayer<PathData>[] {
  if (activities.length === 0) {
    return [];
  }

  return activities.map((activity) => {
    const isSelected = activity.id === selectedActivityId;
    const path = decodePolyline(activity.polyline);
    const color = getActivityColorRGB(
      activity.type,
      isSelected ? DEFAULT_OPACITY : UNSELECTED_OPACITY
    );

    return new PathLayer<PathData>({
      id: `activity-path-${activity.id}`,
      data: [{ path, activity }],
      getPath: (d) => d.path,
      getColor: () => color,
      getWidth: () => (isSelected ? SELECTED_LINE_WIDTH_METERS : DEFAULT_LINE_WIDTH_METERS),
      widthUnits: 'meters',
      widthMinPixels: 1,
      pickable: !!onActivityClick,
      onClick: onActivityClick
        ? (info) => {
            const obj = info.object as PathData | undefined;
            if (obj) {
              onActivityClick(obj.activity);
            }
          }
        : null,
      // Smooth caps and joints for better visual appearance
      capRounded: true,
      jointRounded: true,
    });
  });
}
