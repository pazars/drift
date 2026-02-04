import { useActivityStore } from '../../stores/activityStore';
import { SportFilter, DateRangeFilter } from '../Filters';
import type { DateRange } from '../Filters';
import { ElevationStats } from '../Stats';
import { ActivityList } from './ActivityList';
import type { ActivityType } from '../../types';

const ALL_SPORT_TYPES: ActivityType[] = ['run', 'ride', 'walk', 'hike', 'swim', 'ski', 'other'];

export function SidebarPanel() {
  const { filter, setFilter, filteredActivities, selectActivity, selectedActivityId } =
    useActivityStore();

  const activities = filteredActivities();

  // When no types filter is set, all types are implicitly selected
  const selectedTypes = filter.types ?? ALL_SPORT_TYPES;

  const handleTypesChange = (types: ActivityType[]) => {
    if (types.length === ALL_SPORT_TYPES.length) {
      // Remove types filter when all are selected
      const { types: _removed, ...rest } = filter;
      setFilter(rest);
    } else {
      setFilter({
        ...filter,
        types,
      });
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range === undefined) {
      // Remove date range filter
      const { dateRange: _removed, ...rest } = filter;
      setFilter(rest);
    } else {
      setFilter({
        ...filter,
        dateRange: range,
      });
    }
  };

  return (
    <div className="flex h-full flex-col">
      <SportFilter selectedTypes={selectedTypes} onChange={handleTypesChange} />
      <DateRangeFilter
        startDate={filter.dateRange?.start}
        endDate={filter.dateRange?.end}
        onChange={handleDateRangeChange}
      />
      <div className="p-3">
        <ElevationStats activities={activities} />
      </div>
      <div className="flex-1 overflow-hidden">
        <ActivityList
          activities={activities}
          selectedActivityId={selectedActivityId}
          onSelect={selectActivity}
        />
      </div>
    </div>
  );
}
