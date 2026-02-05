import { useState } from 'react';
import type { SkippedActivity } from '../../stores/activityStore';

export interface SkippedActivitiesProps {
  skippedActivities: SkippedActivity[];
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
    >
      <path
        fillRule="evenodd"
        d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function SkippedActivities({ skippedActivities }: SkippedActivitiesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (skippedActivities.length === 0) {
    return null;
  }

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className="border-t border-gray-200">
      <div
        role="button"
        aria-expanded={isExpanded}
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-2 px-4 py-2 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        data-testid="skipped-activities-header"
      >
        <ChevronIcon expanded={isExpanded} />
        <span className="text-sm text-amber-800 flex-1">
          {skippedActivities.length} skipped (no GPS)
        </span>
      </div>

      {isExpanded && (
        <div
          role="region"
          aria-label="Skipped activities"
          className="bg-amber-50/50 max-h-48 overflow-y-auto"
          data-testid="skipped-activities-list"
        >
          {skippedActivities.map((activity) => (
            <div key={activity.id} className="px-4 py-2 border-t border-amber-100 text-sm">
              <div className="font-medium text-gray-700 truncate">{activity.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {formatDate(activity.date)} &middot; {activity.reason}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
