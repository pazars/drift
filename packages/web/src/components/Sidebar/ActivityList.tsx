import { useRef, useCallback, useState, useMemo } from 'react';
import type { Activity } from '../../types';
import { groupActivitiesByMonth } from '../../utils';
import { ActivityListItem } from './ActivityListItem';

export interface ActivityListProps {
  activities: Activity[];
  selectedActivityId?: string | null;
  hiddenActivityIds?: Set<string>;
  onSelect?: (activityId: string) => void;
  onToggleVisibility?: (activityId: string) => void;
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

export function ActivityList({
  activities,
  selectedActivityId,
  hiddenActivityIds,
  onSelect,
  onToggleVisibility,
}: ActivityListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Group activities by month
  const monthGroups = useMemo(() => groupActivitiesByMonth(activities), [activities]);

  // Collapsed state - stores keys of collapsed months (empty = all expanded except default)
  // By default, only the most recent month is expanded
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(() => {
    const allMonthKeys = monthGroups.map((g) => g.key);
    // Collapse all except the first (most recent) month
    return new Set(allMonthKeys.slice(1));
  });

  // Build flat list of visible activities for keyboard navigation
  const visibleActivities = useMemo(() => {
    return monthGroups
      .filter((group) => !collapsedMonths.has(group.key))
      .flatMap((group) => group.activities);
  }, [monthGroups, collapsedMonths]);

  const toggleMonth = useCallback((monthKey: string) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthKey)) {
        next.delete(monthKey);
      } else {
        next.add(monthKey);
      }
      return next;
    });
  }, []);

  const handleHeaderKeyDown = useCallback(
    (e: React.KeyboardEvent, monthKey: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMonth(monthKey);
      }
    },
    [toggleMonth]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, activityId: string) => {
      const currentIndex = visibleActivities.findIndex((a) => a.id === activityId);
      if (currentIndex === -1) return;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const nextIndex = currentIndex + 1;
          if (nextIndex < visibleActivities.length) {
            const nextItem = listRef.current?.querySelector(
              `[data-testid="activity-item-${visibleActivities[nextIndex]?.id}"]`
            ) as HTMLElement | null;
            nextItem?.focus();
          }
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prevIndex = currentIndex - 1;
          if (prevIndex >= 0) {
            const prevItem = listRef.current?.querySelector(
              `[data-testid="activity-item-${visibleActivities[prevIndex]?.id}"]`
            ) as HTMLElement | null;
            prevItem?.focus();
          }
          break;
        }
        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect?.(activityId);
          break;
      }
    },
    [visibleActivities, onSelect]
  );

  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Only handle if the list itself is the target (not bubbled from items)
      if (e.target === e.currentTarget && e.key === 'ArrowDown' && visibleActivities.length > 0) {
        e.preventDefault();
        const firstItem = listRef.current?.querySelector(
          `[data-testid="activity-item-${visibleActivities[0]?.id}"]`
        ) as HTMLElement | null;
        firstItem?.focus();
      }
    },
    [visibleActivities]
  );

  if (activities.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Activities</h2>
          <p className="text-sm text-gray-500">0 activities</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-gray-500 text-center">No activities found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800">Activities</h2>
        <p className="text-sm text-gray-500">
          {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
        </p>
      </div>

      {/* Scrollable list */}
      <div
        ref={listRef}
        role="listbox"
        aria-label="Activities"
        tabIndex={0}
        onKeyDown={handleListKeyDown}
        className="flex-1 overflow-y-auto focus:outline-none"
      >
        {monthGroups.map((group) => {
          const isExpanded = !collapsedMonths.has(group.key);

          return (
            <div key={group.key}>
              {/* Month header */}
              <div
                id={`month-header-${group.key}`}
                data-testid={`month-header-${group.key}`}
                role="button"
                aria-expanded={isExpanded}
                tabIndex={0}
                onClick={() => toggleMonth(group.key)}
                onKeyDown={(e) => handleHeaderKeyDown(e, group.key)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              >
                <ChevronIcon expanded={isExpanded} />
                <span className="font-medium text-gray-700 flex-1">{group.label}</span>
                <span className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                  {group.activities.length}
                </span>
              </div>

              {/* Activities in this month */}
              {isExpanded && (
                <div
                  data-testid={`month-section-${group.key}`}
                  role="region"
                  aria-labelledby={`month-header-${group.key}`}
                >
                  {group.activities.map((activity) => (
                    <ActivityListItem
                      key={activity.id}
                      activity={activity}
                      isSelected={activity.id === selectedActivityId}
                      isVisible={!hiddenActivityIds?.has(activity.id)}
                      onClick={() => onSelect?.(activity.id)}
                      onKeyDown={(e) => handleKeyDown(e, activity.id)}
                      onToggleVisibility={() => onToggleVisibility?.(activity.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
