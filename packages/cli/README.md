# @drift/cli

GPX preprocessing CLI tool for the Drift application.

## Installation

```bash
pnpm install
pnpm build
```

## Usage

### Process GPX Files

Batch process all GPX files in a directory:

```bash
drift process --input ./gpx-files --output ./processed --format flatgeobuf
```

Options:
- `-i, --input <dir>` - Input directory containing GPX files
- `-o, --output <dir>` - Output directory for processed files
- `-f, --format <format>` - Output format: `flatgeobuf` (default) or `polyline`

### Sync Changed Files

Incrementally process only changed files:

```bash
drift sync --input ./gpx-files --output ./processed
drift sync --input ./gpx-files --output ./processed --force  # Force reprocess all
```

### Watch for Changes

Automatically process new GPX files as they appear:

```bash
drift watch --input ./gpx-files --output ./processed
drift watch --input ./gpx-files --output ./processed --debounce 500
```

### Manage Tags

```bash
# Add tags to files
drift tag add hiking ./activity1.gpx ./activity2.gpx

# Remove tags
drift tag remove hiking ./activity1.gpx

# List tags
drift tag list                    # All defined tags
drift tag list ./activity1.gpx    # Tags for a specific file

# Define tag with color and description
drift tag define hiking --color "#4CAF50" --description "Hiking activities"
```

### Rebuild Index

Regenerate the metadata index from processed files:

```bash
drift rebuild-index --input ./processed --output ./manifest.json
```

## Output Formats

### FlatGeobuf

Binary format optimized for streaming and efficient loading. Best for large datasets.

### Polyline

Encoded polyline format (Google/Flexible Polyline). Compact text representation suitable for URLs and small datasets.

## Development

```bash
pnpm dev          # Watch mode
pnpm test         # Run tests
pnpm test:watch   # Watch tests
pnpm lint         # Lint code
pnpm typecheck    # Type check
```

## Architecture

```
src/
├── bin.ts          # Entry point
├── cli.ts          # Command definitions
├── commands/       # Command implementations
├── parsers/        # GPX parsing (xml, togeojson)
├── transforms/     # Data transformations (simplify, encode)
├── writers/        # Output writers (flatgeobuf, polyline)
├── manifest/       # Manifest file handling
├── errors.ts       # Error types
└── types.ts        # TypeScript types
```
