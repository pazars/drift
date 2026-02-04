import { useRef, useCallback } from 'react';
import type { Activity } from '../../types';
import { ActivityListItem } from './ActivityListItem';

export interface ActivityListProps {
  activities: Activity[];
  selectedActivityId?: string | null;
  onSelect?: (activityId: string) => void;
}

export function ActivityList({ activities, selectedActivityId, onSelect }: ActivityListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, activityId: string, index: number) => {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const nextIndex = index + 1;
          if (nextIndex < activities.length) {
            const nextItem = listRef.current?.querySelector(
              `[data-testid="activity-item-${activities[nextIndex]?.id}"]`
            ) as HTMLElement | null;
            nextItem?.focus();
          }
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prevIndex = index - 1;
          if (prevIndex >= 0) {
            const prevItem = listRef.current?.querySelector(
              `[data-testid="activity-item-${activities[prevIndex]?.id}"]`
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
    [activities, onSelect]
  );

  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Only handle if the list itself is the target (not bubbled from items)
      if (e.target === e.currentTarget && e.key === 'ArrowDown' && activities.length > 0) {
        e.preventDefault();
        const firstItem = listRef.current?.querySelector(
          `[data-testid="activity-item-${activities[0]?.id}"]`
        ) as HTMLElement | null;
        firstItem?.focus();
      }
    },
    [activities]
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
        {activities.map((activity, index) => (
          <ActivityListItem
            key={activity.id}
            activity={activity}
            isSelected={activity.id === selectedActivityId}
            onClick={() => onSelect?.(activity.id)}
            onKeyDown={(e) => handleKeyDown(e, activity.id, index)}
          />
        ))}
      </div>
    </div>
  );
}
