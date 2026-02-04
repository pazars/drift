# Drift Packages

This directory contains the packages that make up the Drift application.

## Packages

### [@drift/cli](./cli)

Command-line tool for preprocessing GPX files exported from Strava. Converts GPX to optimized formats (FlatGeobuf, Polyline) suitable for web visualization.

**Key features:**
- Batch processing of GPX files
- Incremental sync with change detection
- File watching for automatic processing
- Activity tagging system
- Metadata index generation

### [@drift/web](./web)

React web application for visualizing processed GPX activity data on interactive maps.

**Key features:**
- MapLibre GL + deck.gl for high-performance map rendering
- Activity filtering by sport type and date range
- Heatmap and individual track visualization modes
- Elevation profile charts
- Responsive sidebar with activity list

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Strava GPX    │     │    @drift/web   │
│     Export      │     │   (Vite + React)│
└────────┬────────┘     └────────▲────────┘
         │                       │
         ▼                       │
┌─────────────────┐              │
│   @drift/cli    │──────────────┘
│  (process/sync) │   FlatGeobuf + manifest.json
└─────────────────┘
```

## Development

From the repository root:

```bash
bun install       # Install all dependencies
bun run build     # Build all packages
bun run test      # Run all tests
bun run lint      # Lint all packages
```

Package-specific commands can be run with workspace filters:

```bash
bun run --cwd packages/cli test
bun run --cwd packages/web dev
```
