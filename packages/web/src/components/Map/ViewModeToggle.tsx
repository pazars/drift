export type ViewMode = 'tracks' | 'heatmap';

export interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  const handleClick = (newMode: ViewMode) => {
    if (mode !== newMode) {
      onChange(newMode);
    }
  };

  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white shadow-sm">
      <button
        onClick={() => handleClick('tracks')}
        className={`
          px-3 py-1.5 text-sm font-medium rounded-l-lg transition-colors
          ${mode === 'tracks' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}
        `}
      >
        Tracks
      </button>
      <button
        onClick={() => handleClick('heatmap')}
        className={`
          px-3 py-1.5 text-sm font-medium rounded-r-lg transition-colors border-l border-gray-200
          ${mode === 'heatmap' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}
        `}
      >
        Heatmap
      </button>
    </div>
  );
}
