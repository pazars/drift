# @drift/web - AI Context

## Key Patterns

- **TDD Required**: All features developed test-first with Vitest
- **Co-located Tests**: Tests next to components (`Component.test.tsx`)
- **Zustand Stores**: State in `stores/` - reset stores in tests with `store.getState().reset()`
- **Accessibility**: ARIA attributes required, keyboard navigation, reduced motion support

## Testing

- Unit: Vitest + React Testing Library + jsdom
- E2E: Playwright in `e2e/` directory
- Run unit: `pnpm test`
- Run E2E: `pnpm test:e2e`

## Component Structure

```
components/
├── Map/          # MapLibre + deck.gl (heavy dependencies)
├── Layout/       # App shell (Header, Sidebar, Layout)
├── Sidebar/      # Activity list and panels
├── Filters/      # Sport type and date range filters
└── ErrorBoundary/ # Error handling components
```

## State Management

- `activityStore` - Activities, filters, selections
- `uiStore` - UI state (sidebar open, view mode)

## Important Files

- `App.tsx` - Root component composition
- `stores/activityStore.ts` - Main application state
- `hooks/useReducedMotion.ts` - Accessibility hook
- `index.css` - Global styles including reduced motion

## Map Layer

MapLibre GL with deck.gl overlay. Map components have their own error boundary (`MapErrorBoundary`).
