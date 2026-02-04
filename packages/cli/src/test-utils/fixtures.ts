import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Fixtures directory relative to project root
const FIXTURES_DIR = resolve(process.cwd(), 'packages/cli/fixtures');

/**
 * Load a fixture file as a string.
 * @param name - Fixture filename (e.g., 'valid-single-segment.gpx')
 */
export function loadFixture(name: string): string {
  return readFileSync(resolve(FIXTURES_DIR, name), 'utf-8');
}

/**
 * Get the absolute path to a fixture file.
 * @param name - Fixture filename
 */
export function fixturePath(name: string): string {
  return resolve(FIXTURES_DIR, name);
}

/** Available fixture files */
export const FIXTURES = {
  VALID_SINGLE_SEGMENT: 'valid-single-segment.gpx',
  VALID_MULTI_SEGMENT: 'valid-multi-segment.gpx',
  MISSING_ELEVATION: 'missing-elevation.gpx',
  MISSING_TIMESTAMPS: 'missing-timestamps.gpx',
  GARMIN_EXTENSIONS: 'garmin-extensions.gpx',
  STRAVA_EXPORT: 'strava-export.gpx',
  CORRUPTED_XML: 'corrupted-xml.gpx',
  EMPTY_TRACK: 'empty-track.gpx',
} as const;
