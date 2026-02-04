# Drift

[![CI](https://github.com/pazars/drift/actions/workflows/ci.yml/badge.svg)](https://github.com/pazars/drift/actions/workflows/ci.yml)

GPX Activity Visualization App - A local application for visualizing years of GPX activity data from Strava exports.

## Installation

```bash
pnpm install
pnpm build
```

## CLI Usage

```bash
# Process all GPX files in a directory
drift process --input ./gpx-files --output ./processed --format flatgeobuf

# Sync only changed files (incremental processing)
drift sync --input ./gpx-files --output ./processed

# Watch for new files and auto-process
drift watch --input ./gpx-files --output ./processed

# Tag activities
drift tag add hiking ./processed/activity.gpx
drift tag define hiking --color "#4CAF50" --description "Hiking activities"
drift tag list

# Rebuild metadata index
drift rebuild-index --input ./processed --output ./index.json
```

Run `drift --help` for all options.

## Development

```bash
pnpm install      # Install dependencies
pnpm test         # Run tests
pnpm lint         # Run linting
pnpm build        # Build
pnpm ci           # Full CI check
```

## License

MIT
