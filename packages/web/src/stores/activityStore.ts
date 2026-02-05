import { create } from 'zustand';
import type { Activity, ActivityFilter } from '../types';

export interface SkippedActivity {
  id: string;
  name: string;
  date: string;
  reason: string;
}

export interface ActivityState {
  activities: Activity[];
  skippedActivities: SkippedActivity[];
  selectedActivityId: string | null;
  hiddenActivityIds: Set<string>;
  filter: ActivityFilter;
  isLoading: boolean;
  error: string | null;

  // Actions
  setActivities: (activities: Activity[], skipped?: SkippedActivity[]) => void;
  addActivity: (activity: Activity) => void;
  removeActivity: (id: string) => void;
  selectActivity: (id: string | null) => void;
  toggleActivityVisibility: (id: string) => void;
  showAllActivities: () => void;
  hideAllActivities: () => void;
  setFilter: (filter: ActivityFilter) => void;
  clearFilter: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  filteredActivities: () => Activity[];
  getSelectedActivity: () => Activity | undefined;
  isActivityVisible: (id: string) => boolean;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],
  skippedActivities: [],
  selectedActivityId: null,
  hiddenActivityIds: new Set<string>(),
  filter: {},
  isLoading: false,
  error: null,

  setActivities: (activities, skipped = []) =>
    set({ activities, skippedActivities: skipped, hiddenActivityIds: new Set<string>() }),

  addActivity: (activity) => set((state) => ({ activities: [...state.activities, activity] })),

  removeActivity: (id) =>
    set((state) => ({
      activities: state.activities.filter((a) => a.id !== id),
      selectedActivityId: state.selectedActivityId === id ? null : state.selectedActivityId,
    })),

  selectActivity: (id) => set({ selectedActivityId: id }),

  toggleActivityVisibility: (id) =>
    set((state) => {
      const newHidden = new Set(state.hiddenActivityIds);
      if (newHidden.has(id)) {
        newHidden.delete(id);
      } else {
        newHidden.add(id);
      }
      return { hiddenActivityIds: newHidden };
    }),

  showAllActivities: () => set({ hiddenActivityIds: new Set<string>() }),

  hideAllActivities: () =>
    set((state) => ({
      hiddenActivityIds: new Set(state.activities.map((a) => a.id)),
    })),

  setFilter: (filter) => set({ filter }),

  clearFilter: () => set({ filter: {} }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  filteredActivities: () => {
    const { activities, filter } = get();

    return activities.filter((activity) => {
      // Filter by types
      if (filter.types !== undefined) {
        if (!filter.types.includes(activity.type)) {
          return false;
        }
      }

      // Filter by minimum distance
      if (filter.minDistance !== undefined) {
        if (activity.distance < filter.minDistance) {
          return false;
        }
      }

      // Filter by maximum distance
      if (filter.maxDistance !== undefined) {
        if (activity.distance > filter.maxDistance) {
          return false;
        }
      }

      // Filter by tags
      if (filter.tags && filter.tags.length > 0) {
        if (!activity.tags || !filter.tags.some((tag) => activity.tags?.includes(tag))) {
          return false;
        }
      }

      // Filter by date range
      if (filter.dateRange) {
        const activityDate = new Date(activity.date);
        const startDate = new Date(filter.dateRange.start);
        const endDate = new Date(filter.dateRange.end);

        if (activityDate < startDate || activityDate > endDate) {
          return false;
        }
      }

      return true;
    });
  },

  getSelectedActivity: () => {
    const { activities, selectedActivityId } = get();
    return activities.find((a) => a.id === selectedActivityId);
  },

  isActivityVisible: (id) => !get().hiddenActivityIds.has(id),
}));
