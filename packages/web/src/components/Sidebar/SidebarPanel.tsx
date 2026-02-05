import { useMemo } from 'react';
import { useActivityStore } from '../../stores/activityStore';
import { SportFilter, DateRangeFilter, TagFilter } from '../Filters';
import type { DateRange } from '../Filters';
import { ElevationStats, DistanceStats } from '../Stats';
import { ActivityList } from './ActivityList';
import { SkippedActivities } from './SkippedActivities';
import type { ActivityType } from '../../types';

const SPORT_TYPE_ORDER: ActivityType[] = ['run', 'ride', 'walk', 'hike', 'swim', 'ski', 'other'];

export function SidebarPanel() {
  const {
    activities: allActivities,
    skippedActivities,
    filter,
    setFilter,
    filteredActivities,
    selectActivity,
    selectedActivityId,
    hiddenActivityIds,
    toggleActivityVisibility,
  } = useActivityStore();

  const activities = filteredActivities();

  // Compute available types from all loaded activities (preserving order)
  const availableTypes = useMemo(() => {
    const typesInData = new Set(allActivities.map((a) => a.type));
    return SPORT_TYPE_ORDER.filter((type) => typesInData.has(type));
  }, [allActivities]);

  // Compute available tags from all loaded activities (sorted alphabetically)
  const availableTags = useMemo(() => {
    const tagsInData = new Set<string>();
    for (const activity of allActivities) {
      if (activity.tags) {
        for (const tag of activity.tags) {
          tagsInData.add(tag);
        }
      }
    }
    return Array.from(tagsInData).sort();
  }, [allActivities]);

  // When no types filter is set, all available types are implicitly selected
  const selectedTypes = filter.types ?? availableTypes;

  // Get selected tag (first element of tags array, or null if not filtering)
  const selectedTag = filter.tags?.[0] ?? null;

  const handleTypesChange = (types: ActivityType[]) => {
    if (types.length === availableTypes.length) {
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

  const handleTagChange = (tag: string | null) => {
    if (tag === null) {
      // Remove tag filter
      const { tags: _removed, ...rest } = filter;
      setFilter(rest);
    } else {
      setFilter({
        ...filter,
        tags: [tag],
      });
    }
  };

  return (
    <div className="flex h-full flex-col">
      <SportFilter
        selectedTypes={selectedTypes}
        availableTypes={availableTypes}
        onChange={handleTypesChange}
      />
      <DateRangeFilter
        startDate={filter.dateRange?.start}
        endDate={filter.dateRange?.end}
        onChange={handleDateRangeChange}
      />
      <TagFilter
        availableTags={availableTags}
        selectedTag={selectedTag}
        onChange={handleTagChange}
      />
      <div className="p-3 space-y-3">
        <DistanceStats activities={activities} />
        <ElevationStats activities={activities} />
      </div>
      <div className="flex-1 overflow-hidden">
        <ActivityList
          activities={activities}
          selectedActivityId={selectedActivityId}
          hiddenActivityIds={hiddenActivityIds}
          onSelect={selectActivity}
          onToggleVisibility={toggleActivityVisibility}
        />
      </div>
      <SkippedActivities skippedActivities={skippedActivities} />
    </div>
  );
}
