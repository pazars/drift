import type { Activity } from '../types';

export interface MonthGroup {
  key: string; // "2024-03" for sorting/keys
  label: string; // "March 2024" for display
  activities: Activity[];
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  const monthIndex = parseInt(month!, 10) - 1;
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

export function groupActivitiesByMonth(activities: Activity[]): MonthGroup[] {
  if (activities.length === 0) {
    return [];
  }

  // Group activities by YYYY-MM
  const groups = new Map<string, Activity[]>();

  for (const activity of activities) {
    const date = new Date(activity.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}`;

    const existing = groups.get(key);
    if (existing) {
      existing.push(activity);
    } else {
      groups.set(key, [activity]);
    }
  }

  // Convert to array and sort groups descending (newest first)
  const result: MonthGroup[] = Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, groupActivities]) => ({
      key,
      label: formatMonthLabel(key),
      // Sort activities within group by date descending
      activities: groupActivities.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    }));

  return result;
}
