# GPX Test Fixtures

Test fixtures for the GPX parser.

## Files

| Fixture | Description |
|---------|-------------|
| `valid-single-segment.gpx` | Standard GPX with elevation and timestamps |
| `valid-multi-segment.gpx` | Track with 3 segments (simulates GPS signal loss) |
| `missing-elevation.gpx` | Valid GPX without elevation data |
| `missing-timestamps.gpx` | Valid GPX without time data |
| `garmin-extensions.gpx` | Garmin device data (HR, cadence, power, temp) |
| `strava-export.gpx` | Typical Strava export format |
| `corrupted-xml.gpx` | Invalid XML for error handling tests |
| `empty-track.gpx` | Track with no points |

## Usage

```typescript
import { loadFixture, FIXTURES } from '../test-utils/fixtures';

const gpx = loadFixture(FIXTURES.VALID_SINGLE_SEGMENT);
```
