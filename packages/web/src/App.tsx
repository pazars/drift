import { MapContainer, MapErrorBoundary } from './components/Map';
import { Layout } from './components/Layout';
import { SidebarPanel } from './components/Sidebar';
import { useActivityStore } from './stores/activityStore';

/**
 * Main application component.
 */
export function App() {
  const filteredActivities = useActivityStore((state) => state.filteredActivities);
  const activityCount = filteredActivities().length;

  return (
    <Layout sidebar={<SidebarPanel />} activityCount={activityCount}>
      <MapErrorBoundary>
        <MapContainer />
      </MapErrorBoundary>
    </Layout>
  );
}
