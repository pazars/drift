# @drift/web

GPX visualization web application built with React, MapLibre GL, and deck.gl.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173

## Features

- **Interactive Map** - MapLibre GL with deck.gl overlay for high-performance rendering
- **View Modes** - Toggle between heatmap and individual track visualization
- **Activity Filtering** - Filter by sport type (Run, Ride, etc.) and date range
- **Activity List** - Browse and select activities in the sidebar
- **Elevation Charts** - View elevation profiles using Recharts
- **Accessibility** - Full keyboard navigation, screen reader support, reduced motion

## Development

```bash
pnpm dev             # Start dev server (Vite)
pnpm build           # Production build
pnpm preview         # Preview production build

pnpm test            # Run unit tests (Vitest)
pnpm test:watch      # Watch mode
pnpm test:coverage   # With coverage

pnpm test:e2e        # Run E2E tests (Playwright)
pnpm test:e2e:ui     # Playwright UI mode

pnpm lint            # ESLint
pnpm typecheck       # TypeScript check
```

## Architecture

```
src/
├── App.tsx              # Root component
├── main.tsx             # Entry point
├── components/
│   ├── Map/             # MapContainer, MapWithDeck, layers
│   ├── Layout/          # Header, Sidebar, Layout
│   ├── Sidebar/         # ActivityList, SidebarPanel
│   ├── Filters/         # SportFilter, DateRangeFilter
│   ├── Charts/          # ElevationProfile
│   ├── Stats/           # ElevationStats
│   ├── ActivityDetail/  # Activity detail panel
│   └── ErrorBoundary/   # Error boundary components
├── hooks/               # Custom React hooks
├── stores/              # Zustand state stores
├── types/               # TypeScript types
└── utils/               # Utility functions
```

## Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool and dev server
- **TypeScript** - Type safety
- **Zustand** - State management
- **MapLibre GL** - Map rendering
- **deck.gl** - WebGL layers for map
- **Recharts** - Charts
- **Tailwind CSS 4** - Styling
- **Vitest** - Unit testing
- **Playwright** - E2E testing

## Testing

Unit tests are co-located with components (`*.test.tsx`). E2E tests are in the `e2e/` directory.

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test src/components/Map/MapContainer.test.tsx

# E2E tests
pnpm test:e2e
```
