export interface TagFilterProps {
  availableTags: string[];
  selectedTag: string | null;
  onChange: (tag: string | null) => void;
}

export function TagFilter({ availableTags, selectedTag, onChange }: TagFilterProps) {
  if (availableTags.length === 0) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onChange(value === '' ? null : value);
  };

  return (
    <fieldset className="p-4 border-b border-gray-200">
      <legend className="font-semibold text-gray-800 mb-2">Tag</legend>
      <select
        value={selectedTag ?? ''}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        aria-label="Filter by tag"
      >
        <option value="">All activities</option>
        {availableTags.map((tag) => (
          <option key={tag} value={tag}>
            {tag}
          </option>
        ))}
      </select>
    </fieldset>
  );
}
