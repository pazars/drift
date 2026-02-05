/**
 * Activity ID generation from file paths.
 * @module utils/id
 */

import { createHash } from 'node:crypto';

/**
 * Generate a unique activity ID from a source file path.
 *
 * Uses SHA-256 hash of the absolute path, truncated to 12 hex characters.
 * This ensures:
 * - Same file always maps to same ID
 * - Different files get different IDs
 * - IDs are URL-safe and filesystem-safe
 *
 * @param filePath - Absolute path to the source file
 * @returns 12-character hex string ID
 */
export function generateActivityId(filePath: string): string {
  const hash = createHash('sha256').update(filePath).digest('hex');
  return hash.slice(0, 12);
}
