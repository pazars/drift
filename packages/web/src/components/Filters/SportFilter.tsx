import type { ActivityType } from '../../types';
import { getActivityColor } from '../../utils/colors';

export interface SportFilterProps {
  selectedTypes: ActivityType[];
  availableTypes?: ActivityType[];
  onChange: (types: ActivityType[]) => void;
}

const ALL_SPORT_TYPES: ActivityType[] = ['run', 'ride', 'walk', 'hike', 'swim', 'ski', 'other'];

const SPORT_LABELS: Record<ActivityType, string> = {
  run: 'Run',
  ride: 'Ride',
  walk: 'Walk',
  hike: 'Hike',
  swim: 'Swim',
  ski: 'Ski',
  other: 'Other',
};

export function SportFilter({ selectedTypes, availableTypes, onChange }: SportFilterProps) {
  // Only show types that exist in the data, or all types if not specified
  const displayTypes = availableTypes ?? ALL_SPORT_TYPES;

  const handleToggle = (type: ActivityType) => {
    if (selectedTypes.includes(type)) {
      onChange(selectedTypes.filter((t) => t !== type));
    } else {
      onChange([...selectedTypes, type]);
    }
  };

  const handleSelectAll = () => {
    onChange([...displayTypes]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const getSelectionText = () => {
    if (selectedTypes.length === 0) {
      return 'None selected';
    }
    if (selectedTypes.length === displayTypes.length) {
      return 'All selected';
    }
    return `${selectedTypes.length} selected`;
  };

  return (
    <fieldset className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <legend className="font-semibold text-gray-800">Sport Type</legend>
        <span className="text-sm text-gray-500" aria-live="polite">
          {getSelectionText()}
        </span>
      </div>

      <div className="space-y-2 mb-3" role="group" aria-label="Sport type filters">
        {displayTypes.map((type) => (
          <label
            key={type}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
          >
            <input
              type="checkbox"
              checked={selectedTypes.includes(type)}
              onChange={() => handleToggle(type)}
              className="w-4 h-4 rounded border-gray-300"
              aria-label={SPORT_LABELS[type]}
            />
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              aria-hidden="true"
              style={{ backgroundColor: getActivityColor(type) }}
            />
            <span className="text-sm text-gray-700">{SPORT_LABELS[type]}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSelectAll}
          className="flex-1 text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
        >
          Select All
        </button>
        <button
          onClick={handleClearAll}
          className="flex-1 text-xs px-2 py-1 text-gray-600 hover:bg-gray-50 rounded border border-gray-200"
        >
          Clear All
        </button>
      </div>
    </fieldset>
  );
}
