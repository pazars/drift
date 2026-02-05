import { useEffect, useMemo } from 'react';
import { MapWithDeck, MapErrorBoundary, createActivityLayers } from './components/Map';
import { Layout } from './components/Layout';
import { SidebarPanel } from './components/Sidebar';
import { useActivityStore, type SkippedActivity } from './stores/activityStore';
import { transformCliActivity, calculateCombinedBounds } from './utils/transform';
import type { CliIndex, CliActivity } from './utils/transform';
import type { Activity } from './types';

/**
 * Check if an activity has GPS data (non-empty polyline).
 */
function hasGpsData(activity: Activity): boolean {
  return activity.polyline !== undefined && activity.polyline.length > 0;
}

/**
 * Get the reason why an activity was skipped.
 */
function getSkipReason(cliActivity: CliActivity): string {
  if (!cliActivity.overviewPolyline || cliActivity.overviewPolyline.length === 0) {
    return 'No GPS data (treadmill, indoor, or manual entry)';
  }
  return 'Unknown';
}

/**
 * Main application component.
 */
export function App() {
  const setActivities = useActivityStore((state) => state.setActivities);
  const setLoading = useActivityStore((state) => state.setLoading);
  const setError = useActivityStore((state) => state.setError);
  const selectedActivityId = useActivityStore((state) => state.selectedActivityId);
  const selectActivity = useActivityStore((state) => state.selectActivity);
  // Subscribe to activities to trigger re-renders when data loads
  const storeActivities = useActivityStore((state) => state.activities);
  const storeFilter = useActivityStore((state) => state.filter);
  const hiddenActivityIds = useActivityStore((state) => state.hiddenActivityIds);

  // Compute filtered activities with proper dependencies
  const activities = useMemo(() => {
    return storeActivities.filter((activity) => {
      if (storeFilter.types !== undefined && !storeFilter.types.includes(activity.type)) {
        return false;
      }
      if (storeFilter.minDistance !== undefined && activity.distance < storeFilter.minDistance) {
        return false;
      }
      if (storeFilter.maxDistance !== undefined && activity.distance > storeFilter.maxDistance) {
        return false;
      }
      if (storeFilter.tags && storeFilter.tags.length > 0) {
        if (!activity.tags || !storeFilter.tags.some((tag) => activity.tags?.includes(tag))) {
          return false;
        }
      }
      if (storeFilter.dateRange) {
        const activityDate = new Date(activity.date);
        const startDate = new Date(storeFilter.dateRange.start);
        const endDate = new Date(storeFilter.dateRange.end);
        if (activityDate < startDate || activityDate > endDate) {
          return false;
        }
      }
      return true;
    });
  }, [storeActivities, storeFilter]);
  const activityCount = activities.length;

  useEffect(() => {
    async function loadActivities() {
      setLoading(true);
      try {
        const response = await fetch('/data/index.json');
        if (!response.ok) {
          throw new Error(`Failed to load: ${response.statusText}`);
        }
        const data = (await response.json()) as CliIndex;

        // Transform all activities and separate GPS from non-GPS
        const allTransformed = data.activities.map((cliActivity) => ({
          activity: transformCliActivity(cliActivity),
          cliActivity,
        }));

        const withGps: Activity[] = [];
        const skipped: SkippedActivity[] = [];

        for (const { activity, cliActivity } of allTransformed) {
          if (hasGpsData(activity)) {
            withGps.push(activity);
          } else {
            skipped.push({
              id: activity.id,
              name: activity.name,
              date: activity.date,
              reason: getSkipReason(cliActivity),
            });
          }
        }

        setActivities(withGps, skipped);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activities');
      } finally {
        setLoading(false);
      }
    }
    void loadActivities();
  }, [setActivities, setLoading, setError]);

  // Create map layers from visible activities only
  const visibleActivities = useMemo(
    () => activities.filter((a) => !hiddenActivityIds.has(a.id)),
    [activities, hiddenActivityIds]
  );

  const layers = useMemo(
    () => createActivityLayers(visibleActivities, selectedActivityId, (a) => selectActivity(a.id)),
    [visibleActivities, selectedActivityId, selectActivity]
  );

  // Calculate combined bounds from all activities
  const bounds = useMemo(() => calculateCombinedBounds(activities), [activities]);

  return (
    <Layout sidebar={<SidebarPanel />} activityCount={activityCount}>
      <MapErrorBoundary>
        <MapWithDeck layers={layers} bounds={bounds} />
      </MapErrorBoundary>
    </Layout>
  );
}
