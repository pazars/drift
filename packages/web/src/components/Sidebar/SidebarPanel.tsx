import { useActivityStore } from '../../stores/activityStore';
import { SportFilter } from '../Filters';
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

  return (
    <div className="flex h-full flex-col">
      <SportFilter selectedTypes={selectedTypes} onChange={handleTypesChange} />
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
