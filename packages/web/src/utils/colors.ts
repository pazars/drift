import type { ActivityType } from '../types';

/**
 * Color palette for activity types.
 * Uses distinct, accessible colors for each sport type.
 */
export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  run: '#FC4C02', // Strava orange
  ride: '#1A8FE3', // Blue
  walk: '#8BC34A', // Light green
  hike: '#4CAF50', // Green
  swim: '#00BCD4', // Cyan
  ski: '#9C27B0', // Purple
  other: '#607D8B', // Blue grey
};

/**
 * Get the hex color for an activity type.
 */
export function getActivityColor(type: ActivityType): string {
  return ACTIVITY_COLORS[type] ?? ACTIVITY_COLORS.other;
}

/**
 * Convert hex color to RGB array.
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) {
    return [128, 128, 128]; // Fallback grey
  }
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

/**
 * Get RGB(A) array for an activity type.
 * Useful for deck.gl layers which accept [R, G, B] or [R, G, B, A] arrays.
 */
export function getActivityColorRGB(
  type: ActivityType,
  alpha?: number
): [number, number, number] | [number, number, number, number] {
  const hex = getActivityColor(type);
  const rgb = hexToRgb(hex);

  if (alpha !== undefined) {
    return [...rgb, alpha];
  }

  return rgb;
}
