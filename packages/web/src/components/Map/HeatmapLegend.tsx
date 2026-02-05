export function HeatmapLegend() {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 w-fit">
      <div className="text-xs font-medium text-gray-700 mb-1.5">Activity Frequency</div>
      <div
        className="h-2.5 w-28 rounded"
        style={{
          background: 'linear-gradient(to right, #fed7aa, #fb923c, #ea580c, #c2410c)',
        }}
      />
      <div className="flex justify-between w-28 text-[10px] text-gray-500 mt-0.5">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}
