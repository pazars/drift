import { useEffect } from 'react';
import type { Activity } from '../../types';
import { getActivityColor } from '../../utils/colors';

export interface ActivityDetailProps {
  activity: Activity;
  onClose?: () => void;
  onZoomToFit?: () => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDistance(meters: number): string {
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function ActivityDetail({ activity, onClose, onZoomToFit }: ActivityDetailProps) {
  const sportColor = getActivityColor(activity.type);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="bg-white border-l border-gray-200 w-80 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">{activity.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: sportColor }}
              />
              <span className="text-sm text-gray-600">{capitalizeFirst(activity.type)}</span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2">{formatDate(activity.date)}</p>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Distance</p>
            <p className="text-lg font-medium text-gray-900">{formatDistance(activity.distance)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Duration</p>
            <p className="text-lg font-medium text-gray-900">{formatDuration(activity.duration)}</p>
          </div>
          {activity.elevation !== undefined && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Elevation</p>
              <p className="text-lg font-medium text-gray-900">{activity.elevation} m</p>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {activity.tags && activity.tags.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Tags</p>
          <div className="flex flex-wrap gap-1">
            {activity.tags.map((tag) => (
              <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 mt-auto">
        {activity.bounds && onZoomToFit && (
          <button
            onClick={onZoomToFit}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
          >
            Zoom to fit
          </button>
        )}
      </div>
    </div>
  );
}
