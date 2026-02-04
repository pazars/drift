import { MapContainer, MapErrorBoundary } from './components/Map';

/**
 * Main application component.
 */
export function App() {
  return (
    <div className="flex h-screen flex-col">
      <header className="bg-slate-800 px-4 py-3 text-white">
        <h1 className="text-xl font-semibold">Drift</h1>
      </header>
      <main className="relative flex-1">
        <MapErrorBoundary>
          <MapContainer />
        </MapErrorBoundary>
      </main>
    </div>
  );
}
