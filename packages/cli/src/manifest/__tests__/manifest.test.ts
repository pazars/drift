import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  createManifest,
  addFileEntry,
  updateFileStatus,
  getFileEntry,
  getFilesByStatus,
  calculateChecksum,
  saveManifest,
  loadManifest,
  needsProcessing,
} from '../index';

describe('createManifest', () => {
  it('creates empty manifest with version', () => {
    const manifest = createManifest();

    expect(manifest.version).toBe(1);
    expect(manifest.pipelineVersion).toBeDefined();
    expect(manifest.createdAt).toBeInstanceOf(Date);
    expect(manifest.updatedAt).toBeInstanceOf(Date);
    expect(manifest.files).toEqual({});
  });

  it('allows custom pipeline version', () => {
    const manifest = createManifest({ pipelineVersion: '2.0.0' });

    expect(manifest.pipelineVersion).toBe('2.0.0');
  });
});

describe('addFileEntry', () => {
  it('adds new file entry with pending status', () => {
    const manifest = createManifest();
    const checksum = 'abc123def456';

    const updated = addFileEntry(manifest, '/path/to/file.gpx', checksum);

    expect(updated.files['/path/to/file.gpx']).toBeDefined();
    expect(updated.files['/path/to/file.gpx']?.checksum).toBe(checksum);
    expect(updated.files['/path/to/file.gpx']?.status).toBe('pending');
  });

  it('updates checksum for existing file', () => {
    let manifest = createManifest();
    manifest = addFileEntry(manifest, '/path/to/file.gpx', 'old-checksum');
    manifest = updateFileStatus(manifest, '/path/to/file.gpx', 'processed');

    const updated = addFileEntry(manifest, '/path/to/file.gpx', 'new-checksum');

    expect(updated.files['/path/to/file.gpx']?.checksum).toBe('new-checksum');
    // Status should reset to pending when checksum changes
    expect(updated.files['/path/to/file.gpx']?.status).toBe('pending');
  });

  it('preserves status if checksum unchanged', () => {
    let manifest = createManifest();
    manifest = addFileEntry(manifest, '/path/to/file.gpx', 'same-checksum');
    manifest = updateFileStatus(manifest, '/path/to/file.gpx', 'processed');

    const updated = addFileEntry(manifest, '/path/to/file.gpx', 'same-checksum');

    expect(updated.files['/path/to/file.gpx']?.status).toBe('processed');
  });

  it('updates manifest timestamp', () => {
    const manifest = createManifest();
    const originalUpdatedAt = manifest.updatedAt;

    const updated = addFileEntry(manifest, '/path/to/file.gpx', 'checksum');

    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
  });
});

describe('updateFileStatus', () => {
  it('updates status of existing file', () => {
    let manifest = createManifest();
    manifest = addFileEntry(manifest, '/path/to/file.gpx', 'checksum');

    const updated = updateFileStatus(manifest, '/path/to/file.gpx', 'processed');

    expect(updated.files['/path/to/file.gpx']?.status).toBe('processed');
  });

  it('sets processedAt timestamp when status is processed', () => {
    let manifest = createManifest();
    manifest = addFileEntry(manifest, '/path/to/file.gpx', 'checksum');

    const updated = updateFileStatus(manifest, '/path/to/file.gpx', 'processed');

    expect(updated.files['/path/to/file.gpx']?.processedAt).toBeInstanceOf(Date);
  });

  it('sets error message when status is error', () => {
    let manifest = createManifest();
    manifest = addFileEntry(manifest, '/path/to/file.gpx', 'checksum');

    const updated = updateFileStatus(
      manifest,
      '/path/to/file.gpx',
      'error',
      'Parse error: invalid XML'
    );

    expect(updated.files['/path/to/file.gpx']?.status).toBe('error');
    expect(updated.files['/path/to/file.gpx']?.error).toBe('Parse error: invalid XML');
  });

  it('throws for non-existent file', () => {
    const manifest = createManifest();

    expect(() => {
      updateFileStatus(manifest, '/non/existent.gpx', 'processed');
    }).toThrow();
  });
});

describe('getFileEntry', () => {
  it('returns file entry if exists', () => {
    let manifest = createManifest();
    manifest = addFileEntry(manifest, '/path/to/file.gpx', 'checksum123');

    const entry = getFileEntry(manifest, '/path/to/file.gpx');

    expect(entry).toBeDefined();
    expect(entry?.checksum).toBe('checksum123');
  });

  it('returns undefined for non-existent file', () => {
    const manifest = createManifest();

    const entry = getFileEntry(manifest, '/non/existent.gpx');

    expect(entry).toBeUndefined();
  });
});

describe('getFilesByStatus', () => {
  it('returns files with specified status', () => {
    let manifest = createManifest();
    manifest = addFileEntry(manifest, '/file1.gpx', 'checksum1');
    manifest = addFileEntry(manifest, '/file2.gpx', 'checksum2');
    manifest = addFileEntry(manifest, '/file3.gpx', 'checksum3');
    manifest = updateFileStatus(manifest, '/file1.gpx', 'processed');
    manifest = updateFileStatus(manifest, '/file2.gpx', 'error', 'failed');

    const pending = getFilesByStatus(manifest, 'pending');
    const processed = getFilesByStatus(manifest, 'processed');
    const errors = getFilesByStatus(manifest, 'error');

    expect(pending).toEqual(['/file3.gpx']);
    expect(processed).toEqual(['/file1.gpx']);
    expect(errors).toEqual(['/file2.gpx']);
  });

  it('returns empty array if no files match', () => {
    const manifest = createManifest();

    const processed = getFilesByStatus(manifest, 'processed');

    expect(processed).toEqual([]);
  });
});

describe('needsProcessing', () => {
  it('returns true for new file', () => {
    const manifest = createManifest();

    const result = needsProcessing(manifest, '/new/file.gpx', 'new-checksum');

    expect(result).toBe(true);
  });

  it('returns true for file with changed checksum', () => {
    let manifest = createManifest();
    manifest = addFileEntry(manifest, '/file.gpx', 'old-checksum');
    manifest = updateFileStatus(manifest, '/file.gpx', 'processed');

    const result = needsProcessing(manifest, '/file.gpx', 'new-checksum');

    expect(result).toBe(true);
  });

  it('returns false for already processed file with same checksum', () => {
    let manifest = createManifest();
    manifest = addFileEntry(manifest, '/file.gpx', 'same-checksum');
    manifest = updateFileStatus(manifest, '/file.gpx', 'processed');

    const result = needsProcessing(manifest, '/file.gpx', 'same-checksum');

    expect(result).toBe(false);
  });

  it('returns true for pending file', () => {
    let manifest = createManifest();
    manifest = addFileEntry(manifest, '/file.gpx', 'checksum');

    const result = needsProcessing(manifest, '/file.gpx', 'checksum');

    expect(result).toBe(true);
  });

  it('returns true for file with error status', () => {
    let manifest = createManifest();
    manifest = addFileEntry(manifest, '/file.gpx', 'checksum');
    manifest = updateFileStatus(manifest, '/file.gpx', 'error', 'failed');

    const result = needsProcessing(manifest, '/file.gpx', 'checksum');

    expect(result).toBe(true);
  });
});

describe('calculateChecksum', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `manifest-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('calculates SHA-256 checksum of file', async () => {
    const filePath = join(testDir, 'test.txt');
    await writeFile(filePath, 'Hello, World!');

    const checksum = await calculateChecksum(filePath);

    // SHA-256 of "Hello, World!" is well-known
    expect(checksum).toBe('dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f');
  });

  it('produces different checksums for different content', async () => {
    const file1 = join(testDir, 'file1.txt');
    const file2 = join(testDir, 'file2.txt');
    await writeFile(file1, 'Content A');
    await writeFile(file2, 'Content B');

    const checksum1 = await calculateChecksum(file1);
    const checksum2 = await calculateChecksum(file2);

    expect(checksum1).not.toBe(checksum2);
  });

  it('produces same checksum for same content', async () => {
    const file1 = join(testDir, 'file1.txt');
    const file2 = join(testDir, 'file2.txt');
    await writeFile(file1, 'Same content');
    await writeFile(file2, 'Same content');

    const checksum1 = await calculateChecksum(file1);
    const checksum2 = await calculateChecksum(file2);

    expect(checksum1).toBe(checksum2);
  });
});

describe('saveManifest / loadManifest', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `manifest-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('saves manifest to JSON file', async () => {
    const manifestPath = join(testDir, 'manifest.json');
    let manifest = createManifest();
    manifest = addFileEntry(manifest, '/file.gpx', 'checksum');

    await saveManifest(manifest, manifestPath);

    // File should exist and be valid JSON
    const loaded = await loadManifest(manifestPath);
    expect(loaded).toBeDefined();
  });

  it('round-trips manifest without data loss', async () => {
    const manifestPath = join(testDir, 'manifest.json');
    let original = createManifest({ pipelineVersion: '1.2.3' });
    original = addFileEntry(original, '/file1.gpx', 'checksum1');
    original = addFileEntry(original, '/file2.gpx', 'checksum2');
    original = updateFileStatus(original, '/file1.gpx', 'processed');
    original = updateFileStatus(original, '/file2.gpx', 'error', 'Parse failed');

    await saveManifest(original, manifestPath);
    const loaded = await loadManifest(manifestPath);

    expect(loaded.version).toBe(original.version);
    expect(loaded.pipelineVersion).toBe('1.2.3');
    expect(loaded.files['/file1.gpx']?.status).toBe('processed');
    expect(loaded.files['/file2.gpx']?.error).toBe('Parse failed');
  });

  it('restores Date objects correctly', async () => {
    const manifestPath = join(testDir, 'manifest.json');
    let original = createManifest();
    original = addFileEntry(original, '/file.gpx', 'checksum');
    original = updateFileStatus(original, '/file.gpx', 'processed');

    await saveManifest(original, manifestPath);
    const loaded = await loadManifest(manifestPath);

    expect(loaded.createdAt).toBeInstanceOf(Date);
    expect(loaded.updatedAt).toBeInstanceOf(Date);
    expect(loaded.files['/file.gpx']?.addedAt).toBeInstanceOf(Date);
    expect(loaded.files['/file.gpx']?.processedAt).toBeInstanceOf(Date);
  });

  it('returns empty manifest for non-existent file', async () => {
    const manifestPath = join(testDir, 'non-existent.json');

    const loaded = await loadManifest(manifestPath);

    expect(loaded.files).toEqual({});
  });
});

describe('edge cases', () => {
  it('handles paths with special characters', () => {
    let manifest = createManifest();
    const specialPath = '/path/with spaces/and-dashes/file (1).gpx';

    manifest = addFileEntry(manifest, specialPath, 'checksum');

    expect(manifest.files[specialPath]).toBeDefined();
    expect(getFileEntry(manifest, specialPath)?.checksum).toBe('checksum');
  });

  it('handles large number of files', () => {
    let manifest = createManifest();

    for (let i = 0; i < 1000; i++) {
      manifest = addFileEntry(manifest, `/file${i}.gpx`, `checksum${i}`);
    }

    expect(Object.keys(manifest.files)).toHaveLength(1000);
    expect(getFileEntry(manifest, '/file500.gpx')?.checksum).toBe('checksum500');
  });
});
