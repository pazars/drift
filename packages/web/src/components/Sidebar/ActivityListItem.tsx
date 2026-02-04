import type { Activity } from '../../types';
import { getActivityColor } from '../../utils/colors';

export interface ActivityListItemProps {
  activity: Activity;
  isSelected?: boolean;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

/**
 * Format distance in kilometers or meters.
 */
function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
}

/**
 * Format date to readable string.
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format duration in hours and minutes.
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function ActivityListItem({
  activity,
  isSelected = false,
  onClick,
  onKeyDown,
}: ActivityListItemProps) {
  const sportColor = getActivityColor(activity.type);

  return (
    <div
      data-testid={`activity-item-${activity.id}`}
      data-selected={isSelected}
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={`
        flex items-start gap-3 p-3 cursor-pointer transition-colors border-b border-gray-100
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
        ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
      `}
    >
      {/* Sport color indicator */}
      <div
        data-testid="sport-color"
        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
        style={{ backgroundColor: sportColor }}
      />

      {/* Activity details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{activity.name}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
          <span>{formatDistance(activity.distance)}</span>
          <span>•</span>
          <span>{formatDuration(activity.duration)}</span>
        </div>
        <div className="text-xs text-gray-400 mt-1">{formatDate(activity.date)}</div>
      </div>
    </div>
  );
}
