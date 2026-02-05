import type { Activity } from '../../types';
import { getActivityColor } from '../../utils/colors';

export interface ActivityListItemProps {
  activity: Activity;
  isSelected?: boolean;
  isVisible?: boolean;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onToggleVisibility?: () => void;
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
  isVisible = true,
  onClick,
  onKeyDown,
  onToggleVisibility,
}: ActivityListItemProps) {
  const sportColor = getActivityColor(activity.type);

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleVisibility?.();
  };

  return (
    <div
      data-testid={`activity-item-${activity.id}`}
      data-selected={isSelected}
      data-visible={isVisible}
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={`
        flex items-start gap-3 p-3 cursor-pointer transition-colors border-b border-gray-100
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
        ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
        ${!isVisible ? 'opacity-50' : ''}
      `}
    >
      {/* Visibility toggle */}
      <button
        type="button"
        data-testid={`visibility-toggle-${activity.id}`}
        onClick={handleToggleClick}
        aria-label={isVisible ? 'Hide activity on map' : 'Show activity on map'}
        className="mt-0.5 p-1 rounded hover:bg-gray-200 transition-colors flex-shrink-0"
      >
        {isVisible ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 text-gray-600"
          >
            <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
            <path
              fillRule="evenodd"
              d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 text-gray-400"
          >
            <path
              fillRule="evenodd"
              d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z"
              clipRule="evenodd"
            />
            <path d="m10.748 13.93 2.523 2.523a9.987 9.987 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186 10.007 10.007 0 0 1 2.89-4.1l2.5 2.5a4 4 0 0 0 4.694 4.694" />
          </svg>
        )}
      </button>

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
