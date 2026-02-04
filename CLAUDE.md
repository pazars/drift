# Development Guide

## Project Structure

```
drift/
├── packages/
│   ├── cli/          # GPX preprocessing CLI (@drift/cli)
│   └── web/          # Visualization web app (@drift/web)
├── docs/             # Planning documents (gitignored)
└── data/             # GPX data directory (gitignored)
```

## Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev                    # Start web dev server
pnpm --filter @drift/cli dev    # Watch CLI

# Testing
pnpm test                   # Run all tests
pnpm test:coverage          # With coverage
pnpm --filter @drift/cli test:watch  # Watch mode

# Quality
pnpm lint                   # ESLint
pnpm lint:fix               # Auto-fix
pnpm format                 # Prettier
pnpm typecheck              # TypeScript

# Build
pnpm build                  # Build all packages
pnpm run ci                 # Full CI check locally
```

## Git Hooks

- **pre-commit**: Runs `lint-staged` (ESLint + Prettier on staged files)
- **pre-push**: Runs `typecheck` and `test`

## CI/CD Pipeline

GitHub Actions runs on push to `main` and PRs:

1. **lint** - ESLint + Prettier check
2. **typecheck** - TypeScript compilation
3. **test** - Vitest with coverage → Codecov
4. **build** - Production build (requires lint/typecheck/test to pass)

## Adding Dependencies

```bash
# Root workspace
pnpm add -D -w <package>

# Specific package
pnpm add --filter @drift/cli <package>
pnpm add --filter @drift/web <package>
```

## Test-Driven Development

1. Write tests first in `src/__tests__/*.test.ts`
2. Run `pnpm test:watch` during development
3. Implement until tests pass
