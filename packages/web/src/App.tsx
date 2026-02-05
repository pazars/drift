import { useEffect, useMemo } from 'react';
import { MapWithDeck, MapErrorBoundary, createActivityLayers } from './components/Map';
import { Layout } from './components/Layout';
import { SidebarPanel } from './components/Sidebar';
import { useActivityStore } from './stores/activityStore';
import { transformCliActivity, calculateCombinedBounds } from './utils/transform';
import type { CliIndex } from './utils/transform';

/**
 * Main application component.
 */
export function App() {
  const setActivities = useActivityStore((state) => state.setActivities);
  const setLoading = useActivityStore((state) => state.setLoading);
  const setError = useActivityStore((state) => state.setError);
  const filteredActivities = useActivityStore((state) => state.filteredActivities);
  const activityCount = filteredActivities().length;

  const activities = filteredActivities();
  const selectedActivityId = useActivityStore((state) => state.selectedActivityId);
  const selectActivity = useActivityStore((state) => state.selectActivity);

  useEffect(() => {
    async function loadActivities() {
      setLoading(true);
      try {
        const response = await fetch('/data/index.json');
        if (!response.ok) {
          throw new Error(`Failed to load: ${response.statusText}`);
        }
        const data = (await response.json()) as CliIndex;
        const loaded = data.activities.map(transformCliActivity);
        setActivities(loaded);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activities');
      } finally {
        setLoading(false);
      }
    }
    void loadActivities();
  }, [setActivities, setLoading, setError]);

  // Create map layers from activities
  const layers = useMemo(
    () => createActivityLayers(activities, selectedActivityId, (a) => selectActivity(a.id)),
    [activities, selectedActivityId, selectActivity]
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
