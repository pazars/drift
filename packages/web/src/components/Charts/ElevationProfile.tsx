import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export interface ElevationDataPoint {
  distance: number; // in meters
  elevation: number; // in meters
}

export interface ElevationProfileProps {
  data: ElevationDataPoint[];
  height?: number;
}

function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatElevation(meters: number): string {
  return `${meters.toFixed(0)} m`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ElevationDataPoint }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const firstPayload = payload[0];
  if (!firstPayload) {
    return null;
  }

  const data = firstPayload.payload;
  return (
    <div className="bg-white px-3 py-2 shadow-lg rounded border border-gray-200">
      <p className="text-sm text-gray-600">
        Distance: <span className="font-medium">{formatDistance(data.distance)}</span>
      </p>
      <p className="text-sm text-gray-600">
        Elevation: <span className="font-medium">{formatElevation(data.elevation)}</span>
      </p>
    </div>
  );
}

export function ElevationProfile({ data, height = 200 }: ElevationProfileProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500 text-sm" style={{ height }}>
        No elevation data available
      </div>
    );
  }

  const minElevation = Math.min(...data.map((d) => d.elevation));
  const maxElevation = Math.max(...data.map((d) => d.elevation));
  const elevationPadding = (maxElevation - minElevation) * 0.1 || 10;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis
            dataKey="distance"
            tickFormatter={formatDistance}
            tick={{ fontSize: 11, fill: '#6B7280' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatElevation}
            tick={{ fontSize: 11, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
            domain={[minElevation - elevationPadding, maxElevation + elevationPadding]}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="elevation"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#elevationGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
