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

## Git Workflow

### Branch Strategy

Each GitHub issue is worked on in its own branch:

```bash
git checkout -b feature/issue-5-core-types
# or
git checkout -b fix/issue-42-parser-bug
```

### Commits

Reference the issue number and describe what the commit achieves:

```
feat(cli): add TrackPoint and TrackSegment types (#5)
fix(parser): handle missing elevation data (#42)
test(cli): add GPX parser edge case tests (#7)
```

**Do not** add Co-Authored-By lines or any email addresses to commits.

### Pull Requests

1. Push branch and open PR against `main`
2. CI workflow runs automatically (lint, typecheck, test, build)
3. All checks must pass before merging
4. Use squash merge or regular merge

### CI Verification

The GitHub Actions workflow runs on every PR to verify:
- Code passes linting (ESLint + Prettier)
- TypeScript compiles without errors
- All tests pass
- Build succeeds

## Commands

```bash
pnpm install              # Install dependencies
pnpm dev                  # Start web dev server
pnpm test                 # Run all tests
pnpm test:coverage        # With coverage
pnpm lint                 # ESLint check
pnpm typecheck            # TypeScript check
pnpm build                # Build all packages
pnpm run ci               # Full CI check locally
```

## Git Hooks

- **pre-commit**: Runs lint-staged (ESLint + Prettier on staged files)
- **pre-push**: Runs typecheck and test

## Adding Dependencies

```bash
pnpm add -D -w <package>              # Root workspace
pnpm add --filter @drift/cli <pkg>    # CLI package
pnpm add --filter @drift/web <pkg>    # Web package
```

## Test-Driven Development

1. Write tests first in `src/__tests__/*.test.ts`
2. Run `pnpm test:watch` during development
3. Implement until tests pass
