import type { Activity } from '../../types';
import { ActivityListItem } from './ActivityListItem';

export interface ActivityListProps {
  activities: Activity[];
  selectedActivityId?: string | null;
  onSelect?: (activityId: string) => void;
}

export function ActivityList({ activities, selectedActivityId, onSelect }: ActivityListProps) {
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
      <div className="flex-1 overflow-y-auto">
        {activities.map((activity) => (
          <ActivityListItem
            key={activity.id}
            activity={activity}
            isSelected={activity.id === selectedActivityId}
            onClick={() => onSelect?.(activity.id)}
          />
        ))}
      </div>
    </div>
  );
}
