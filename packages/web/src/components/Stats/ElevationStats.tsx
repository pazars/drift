import type { Activity } from '../../types';

export interface ElevationStatsProps {
  activities: Activity[];
}

export function ElevationStats({ activities }: ElevationStatsProps) {
  const totalElevation = activities.reduce((sum, activity) => {
    return sum + (activity.elevation ?? 0);
  }, 0);

  const formattedElevation = totalElevation.toLocaleString();
  const activityCount = activities.length;
  const activityLabel = activityCount === 1 ? 'activity' : 'activities';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Total Elevation
      </div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{formattedElevation} m</div>
      <div className="mt-1 text-sm text-gray-500">
        from {activityCount} {activityLabel}
      </div>
    </div>
  );
}
