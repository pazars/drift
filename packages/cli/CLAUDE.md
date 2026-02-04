# @drift/cli - AI Context

## Key Patterns

- **TDD Required**: All features developed test-first with Vitest
- **Error Handling**: Custom error classes in `errors.ts` - use `GpxParseError`, `FileWriteError`, etc.
- **Pure Functions**: Parsers and transforms are pure functions for testability

## Architecture

```
GPX File → Parser → GeoJSON → Transform → Writer → Output
```

- Parsers (`parsers/`): Convert GPX XML to GeoJSON
- Transforms (`transforms/`): Simplify, encode coordinates
- Writers (`writers/`): Output FlatGeobuf or Polyline format

## Testing

- Tests in `src/__tests__/` directory
- Test fixtures in `src/test-utils/`
- Run: `pnpm test`

## Commands

CLI uses Commander.js. Commands defined in `cli.ts`, implementations in `commands/`.

## Important Files

- `cli.ts` - All CLI command definitions
- `types.ts` - Core TypeScript interfaces
- `manifest/` - Manifest file reading/writing for incremental processing
