import type { Activity } from '../../types';

export interface DistanceStatsProps {
  activities: Activity[];
}

export function DistanceStats({ activities }: DistanceStatsProps) {
  const totalMeters = activities.reduce((sum, activity) => {
    return sum + activity.distance;
  }, 0);

  const totalKm = totalMeters / 1000;
  const formattedDistance = totalKm.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const activityCount = activities.length;
  const activityLabel = activityCount === 1 ? 'activity' : 'activities';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Total Distance
      </div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{formattedDistance} km</div>
      <div className="mt-1 text-sm text-gray-500">
        from {activityCount} {activityLabel}
      </div>
    </div>
  );
}
