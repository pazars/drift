import { describe, it, expect } from 'vitest';
import { generateActivityId } from '../id';

describe('generateActivityId', () => {
  it('produces a 12-character hex string', () => {
    const id = generateActivityId('/path/to/file.gpx');

    expect(id).toMatch(/^[a-f0-9]{12}$/);
  });

  it('is deterministic for the same path', () => {
    const path = '/home/user/activities/morning-run.gpx';
    const id1 = generateActivityId(path);
    const id2 = generateActivityId(path);

    expect(id1).toBe(id2);
  });

  it('produces different IDs for different paths', () => {
    const id1 = generateActivityId('/path/to/file1.gpx');
    const id2 = generateActivityId('/path/to/file2.gpx');

    expect(id1).not.toBe(id2);
  });

  it('handles paths with special characters', () => {
    const id = generateActivityId('/path/to/Morning Run (1).gpx');

    expect(id).toMatch(/^[a-f0-9]{12}$/);
  });
});
