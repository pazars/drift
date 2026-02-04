export interface DateRange {
  start: string;
  end: string;
}

export interface DateRangeFilterProps {
  startDate?: string | undefined;
  endDate?: string | undefined;
  onChange: (range: DateRange | undefined) => void;
}

interface Preset {
  label: string;
  getRange: () => DateRange;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPresets(): Preset[] {
  const today = new Date();
  const todayStr = formatDate(today);

  return [
    {
      label: 'Last 30 days',
      getRange: () => {
        const start = new Date(today);
        start.setDate(start.getDate() - 30);
        return { start: formatDate(start), end: todayStr };
      },
    },
    {
      label: 'Last 90 days',
      getRange: () => {
        const start = new Date(today);
        start.setDate(start.getDate() - 90);
        return { start: formatDate(start), end: todayStr };
      },
    },
    {
      label: 'This year',
      getRange: () => {
        const start = new Date(today.getFullYear(), 0, 1);
        return { start: formatDate(start), end: todayStr };
      },
    },
  ];
}

function isPresetActive(preset: Preset, startDate?: string, endDate?: string): boolean {
  if (!startDate || !endDate) return false;
  const range = preset.getRange();
  return range.start === startDate && range.end === endDate;
}

export function DateRangeFilter({ startDate, endDate, onChange }: DateRangeFilterProps) {
  const presets = getPresets();

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      start: e.target.value,
      end: endDate ?? formatDate(new Date()),
    });
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      start: startDate ?? '',
      end: e.target.value,
    });
  };

  const handlePresetClick = (preset: Preset) => {
    onChange(preset.getRange());
  };

  const handleClearClick = () => {
    onChange(undefined);
  };

  return (
    <fieldset className="p-4 border-b border-gray-200">
      <legend className="font-semibold text-gray-800 mb-3">Date Range</legend>

      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="date-from" className="block text-xs text-gray-500 mb-1">
              From
            </label>
            <input
              type="date"
              id="date-from"
              value={startDate ?? ''}
              onChange={handleStartChange}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="date-to" className="block text-xs text-gray-500 mb-1">
              To
            </label>
            <input
              type="date"
              id="date-to"
              value={endDate ?? ''}
              onChange={handleEndChange}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1" role="group" aria-label="Quick date presets">
          {presets.map((preset) => {
            const isActive = isPresetActive(preset, startDate, endDate);
            return (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                aria-pressed={isActive}
                className={`
                  text-xs px-2 py-1 rounded border transition-colors
                  ${
                    isActive
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                {preset.label}
              </button>
            );
          })}
          <button
            onClick={handleClearClick}
            aria-pressed={!startDate && !endDate}
            className={`
              text-xs px-2 py-1 rounded border transition-colors
              ${
                !startDate && !endDate
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            All time
          </button>
        </div>
      </div>
    </fieldset>
  );
}
