import { describe, it, expect, beforeEach } from 'vitest';
import { useActivityStore } from '../activityStore';
import type { Activity, ActivityFilter } from '../../types';

// Reset store state before each test
beforeEach(() => {
  useActivityStore.setState({
    activities: [],
    selectedActivityId: null,
    filter: {},
    isLoading: false,
    error: null,
  });
});

const mockActivity: Activity = {
  id: 'activity-1',
  name: 'Morning Run',
  type: 'run',
  date: '2024-01-15T08:00:00Z',
  distance: 5000,
  duration: 1800,
  elevation: 50,
  polyline: 'encoded_polyline_string',
  tags: ['morning', 'easy'],
};

const mockActivity2: Activity = {
  id: 'activity-2',
  name: 'Evening Ride',
  type: 'ride',
  date: '2024-01-16T18:00:00Z',
  distance: 25000,
  duration: 3600,
  elevation: 200,
  polyline: 'encoded_polyline_string_2',
  tags: ['evening', 'hard'],
};

describe('activityStore', () => {
  describe('initial state', () => {
    it('starts with empty activities array', () => {
      const { activities } = useActivityStore.getState();
      expect(activities).toEqual([]);
    });

    it('starts with no selected activity', () => {
      const { selectedActivityId } = useActivityStore.getState();
      expect(selectedActivityId).toBeNull();
    });

    it('starts with empty filter', () => {
      const { filter } = useActivityStore.getState();
      expect(filter).toEqual({});
    });

    it('starts with loading false', () => {
      const { isLoading } = useActivityStore.getState();
      expect(isLoading).toBe(false);
    });

    it('starts with no error', () => {
      const { error } = useActivityStore.getState();
      expect(error).toBeNull();
    });
  });

  describe('setActivities', () => {
    it('sets activities array', () => {
      const { setActivities } = useActivityStore.getState();
      setActivities([mockActivity]);

      const { activities } = useActivityStore.getState();
      expect(activities).toHaveLength(1);
      expect(activities[0]).toEqual(mockActivity);
    });

    it('replaces existing activities', () => {
      const { setActivities } = useActivityStore.getState();
      setActivities([mockActivity]);
      setActivities([mockActivity2]);

      const { activities } = useActivityStore.getState();
      expect(activities).toHaveLength(1);
      expect(activities[0]?.id).toBe('activity-2');
    });
  });

  describe('addActivity', () => {
    it('adds a single activity', () => {
      const { addActivity } = useActivityStore.getState();
      addActivity(mockActivity);

      const { activities } = useActivityStore.getState();
      expect(activities).toHaveLength(1);
    });

    it('appends to existing activities', () => {
      const { setActivities, addActivity } = useActivityStore.getState();
      setActivities([mockActivity]);
      addActivity(mockActivity2);

      const { activities } = useActivityStore.getState();
      expect(activities).toHaveLength(2);
    });
  });

  describe('removeActivity', () => {
    it('removes activity by id', () => {
      const { setActivities, removeActivity } = useActivityStore.getState();
      setActivities([mockActivity, mockActivity2]);
      removeActivity('activity-1');

      const { activities } = useActivityStore.getState();
      expect(activities).toHaveLength(1);
      expect(activities[0]?.id).toBe('activity-2');
    });

    it('clears selection if removed activity was selected', () => {
      const { setActivities, selectActivity, removeActivity } = useActivityStore.getState();
      setActivities([mockActivity]);
      selectActivity('activity-1');
      removeActivity('activity-1');

      const { selectedActivityId } = useActivityStore.getState();
      expect(selectedActivityId).toBeNull();
    });
  });

  describe('selectActivity', () => {
    it('sets selected activity id', () => {
      const { setActivities, selectActivity } = useActivityStore.getState();
      setActivities([mockActivity]);
      selectActivity('activity-1');

      const { selectedActivityId } = useActivityStore.getState();
      expect(selectedActivityId).toBe('activity-1');
    });

    it('can clear selection with null', () => {
      const { setActivities, selectActivity } = useActivityStore.getState();
      setActivities([mockActivity]);
      selectActivity('activity-1');
      selectActivity(null);

      const { selectedActivityId } = useActivityStore.getState();
      expect(selectedActivityId).toBeNull();
    });
  });

  describe('setFilter', () => {
    it('sets filter state', () => {
      const { setFilter } = useActivityStore.getState();
      const filter: ActivityFilter = { types: ['run'] };
      setFilter(filter);

      const state = useActivityStore.getState();
      expect(state.filter).toEqual(filter);
    });

    it('replaces existing filter', () => {
      const { setFilter } = useActivityStore.getState();
      setFilter({ types: ['run'] });
      setFilter({ types: ['ride'] });

      const { filter } = useActivityStore.getState();
      expect(filter.types).toEqual(['ride']);
    });
  });

  describe('clearFilter', () => {
    it('resets filter to empty object', () => {
      const { setFilter, clearFilter } = useActivityStore.getState();
      setFilter({ types: ['run'], minDistance: 1000 });
      clearFilter();

      const { filter } = useActivityStore.getState();
      expect(filter).toEqual({});
    });
  });

  describe('filteredActivities', () => {
    it('returns all activities when no filter', () => {
      const { setActivities } = useActivityStore.getState();
      setActivities([mockActivity, mockActivity2]);

      const { filteredActivities } = useActivityStore.getState();
      expect(filteredActivities()).toHaveLength(2);
    });

    it('filters by activity type', () => {
      const { setActivities, setFilter } = useActivityStore.getState();
      setActivities([mockActivity, mockActivity2]);
      setFilter({ types: ['run'] });

      const { filteredActivities } = useActivityStore.getState();
      expect(filteredActivities()).toHaveLength(1);
      expect(filteredActivities()[0]?.type).toBe('run');
    });

    it('filters by multiple types', () => {
      const { setActivities, setFilter } = useActivityStore.getState();
      setActivities([mockActivity, mockActivity2]);
      setFilter({ types: ['run', 'ride'] });

      const { filteredActivities } = useActivityStore.getState();
      expect(filteredActivities()).toHaveLength(2);
    });

    it('filters by minimum distance', () => {
      const { setActivities, setFilter } = useActivityStore.getState();
      setActivities([mockActivity, mockActivity2]);
      setFilter({ minDistance: 10000 });

      const { filteredActivities } = useActivityStore.getState();
      expect(filteredActivities()).toHaveLength(1);
      expect(filteredActivities()[0]?.distance).toBe(25000);
    });

    it('filters by maximum distance', () => {
      const { setActivities, setFilter } = useActivityStore.getState();
      setActivities([mockActivity, mockActivity2]);
      setFilter({ maxDistance: 10000 });

      const { filteredActivities } = useActivityStore.getState();
      expect(filteredActivities()).toHaveLength(1);
      expect(filteredActivities()[0]?.distance).toBe(5000);
    });

    it('filters by tags', () => {
      const { setActivities, setFilter } = useActivityStore.getState();
      setActivities([mockActivity, mockActivity2]);
      setFilter({ tags: ['morning'] });

      const { filteredActivities } = useActivityStore.getState();
      expect(filteredActivities()).toHaveLength(1);
      expect(filteredActivities()[0]?.tags).toContain('morning');
    });

    it('filters by date range', () => {
      const { setActivities, setFilter } = useActivityStore.getState();
      setActivities([mockActivity, mockActivity2]);
      setFilter({
        dateRange: {
          start: '2024-01-16T00:00:00Z',
          end: '2024-01-17T00:00:00Z',
        },
      });

      const { filteredActivities } = useActivityStore.getState();
      expect(filteredActivities()).toHaveLength(1);
      expect(filteredActivities()[0]?.id).toBe('activity-2');
    });
  });

  describe('loading state', () => {
    it('can set loading state', () => {
      const { setLoading } = useActivityStore.getState();
      setLoading(true);

      const { isLoading } = useActivityStore.getState();
      expect(isLoading).toBe(true);
    });
  });

  describe('error state', () => {
    it('can set error', () => {
      const { setError } = useActivityStore.getState();
      setError('Failed to load activities');

      const { error } = useActivityStore.getState();
      expect(error).toBe('Failed to load activities');
    });

    it('can clear error', () => {
      const { setError } = useActivityStore.getState();
      setError('Error');
      setError(null);

      const { error } = useActivityStore.getState();
      expect(error).toBeNull();
    });
  });

  describe('getSelectedActivity', () => {
    it('returns selected activity', () => {
      const { setActivities, selectActivity, getSelectedActivity } = useActivityStore.getState();
      setActivities([mockActivity]);
      selectActivity('activity-1');

      expect(getSelectedActivity()).toEqual(mockActivity);
    });

    it('returns undefined when nothing selected', () => {
      const { getSelectedActivity } = useActivityStore.getState();
      expect(getSelectedActivity()).toBeUndefined();
    });
  });
});
