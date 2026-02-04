/**
 * Main application component.
 */
export function App() {
  return (
    <div className="flex h-screen flex-col">
      <header className="bg-slate-800 px-4 py-3 text-white">
        <h1 className="text-xl font-semibold">Drift</h1>
      </header>
      <main className="flex flex-1 items-center justify-center bg-slate-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-700">GPX Activity Visualization</h2>
          <p className="mt-2 text-slate-500">Map and activity list coming soon...</p>
        </div>
      </main>
    </div>
  );
}
