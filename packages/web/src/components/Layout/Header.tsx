export interface HeaderProps {
  activityCount?: number | undefined;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function Header({ activityCount, onToggleSidebar, isSidebarOpen }: HeaderProps) {
  return (
    <header
      role="banner"
      className="flex items-center justify-between h-14 px-4 bg-slate-800 text-white"
    >
      <div className="flex items-center gap-4">
        {/* Mobile sidebar toggle */}
        {onToggleSidebar && (
          <button
            aria-label="Toggle sidebar"
            aria-expanded={isSidebarOpen}
            aria-controls="sidebar"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 hover:bg-slate-700 rounded"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isSidebarOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        )}

        <h1 className="text-xl font-semibold">Drift</h1>
      </div>

      {activityCount !== undefined && (
        <div className="text-sm text-slate-300">
          {activityCount} {activityCount === 1 ? 'activity' : 'activities'}
        </div>
      )}
    </header>
  );
}
