import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { scanDirectory, syncFiles, type SyncOptions, type FileProcessor } from '../sync';
import { createManifest, addFileEntry, updateFileStatus } from '../../manifest';

// Sample GPX content for testing
const SAMPLE_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <trk>
    <name>Test Track</name>
    <trkseg>
      <trkpt lat="37.7749" lon="-122.4194">
        <ele>100</ele>
        <time>2024-01-15T10:00:00Z</time>
      </trkpt>
      <trkpt lat="37.7750" lon="-122.4190">
        <ele>105</ele>
        <time>2024-01-15T10:01:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

const SAMPLE_GPX_2 = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <trk>
    <name>Another Track</name>
    <trkseg>
      <trkpt lat="38.0" lon="-121.0">
        <ele>200</ele>
        <time>2024-01-16T10:00:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

describe('scanDirectory', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `sync-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('finds GPX files in directory', async () => {
    await writeFile(join(testDir, 'activity1.gpx'), SAMPLE_GPX);
    await writeFile(join(testDir, 'activity2.gpx'), SAMPLE_GPX_2);

    const files = await scanDirectory(testDir);

    expect(files).toHaveLength(2);
    expect(files.map((f) => f.endsWith('.gpx'))).toEqual([true, true]);
  });

  it('finds GPX files in subdirectories', async () => {
    await mkdir(join(testDir, 'subdir'), { recursive: true });
    await writeFile(join(testDir, 'root.gpx'), SAMPLE_GPX);
    await writeFile(join(testDir, 'subdir', 'nested.gpx'), SAMPLE_GPX_2);

    const files = await scanDirectory(testDir);

    expect(files).toHaveLength(2);
  });

  it('ignores non-GPX files', async () => {
    await writeFile(join(testDir, 'activity.gpx'), SAMPLE_GPX);
    await writeFile(join(testDir, 'readme.txt'), 'text file');
    await writeFile(join(testDir, 'data.json'), '{}');

    const files = await scanDirectory(testDir);

    expect(files).toHaveLength(1);
    expect(files[0]).toContain('.gpx');
  });

  it('returns empty array for directory with no GPX files', async () => {
    await writeFile(join(testDir, 'readme.txt'), 'text file');

    const files = await scanDirectory(testDir);

    expect(files).toEqual([]);
  });

  it('returns absolute paths', async () => {
    await writeFile(join(testDir, 'activity.gpx'), SAMPLE_GPX);

    const files = await scanDirectory(testDir);

    expect(files[0]).toMatch(/^\//); // Starts with / (absolute path)
    expect(files[0]).toContain(testDir);
  });
});

describe('syncFiles', () => {
  let testDir: string;
  let outputDir: string;
  let mockProcessor: FileProcessor;

  beforeEach(async () => {
    testDir = join(tmpdir(), `sync-test-${Date.now()}`);
    outputDir = join(testDir, 'output');
    await mkdir(testDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });

    // Mock processor that simulates successful processing
    mockProcessor = vi.fn().mockResolvedValue({
      success: true,
      outputPath: '/output/file.fgb',
    });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('processes new files', async () => {
    await writeFile(join(testDir, 'new.gpx'), SAMPLE_GPX);

    const options: SyncOptions = {
      inputDir: testDir,
      outputDir,
      manifest: createManifest(),
      processor: mockProcessor,
    };

    const result = await syncFiles(options);

    expect(result.processed).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toBe(0);
    expect(mockProcessor).toHaveBeenCalledTimes(1);
  });

  it('skips unchanged files', async () => {
    const filePath = join(testDir, 'unchanged.gpx');
    await writeFile(filePath, SAMPLE_GPX);

    // Create manifest with existing entry
    let manifest = createManifest();
    const { calculateChecksum } = await import('../../manifest');
    const checksum = await calculateChecksum(filePath);
    manifest = addFileEntry(manifest, filePath, checksum);
    manifest = updateFileStatus(manifest, filePath, 'processed');

    const options: SyncOptions = {
      inputDir: testDir,
      outputDir,
      manifest,
      processor: mockProcessor,
    };

    const result = await syncFiles(options);

    expect(result.processed).toBe(0);
    expect(result.skipped).toBe(1);
    expect(mockProcessor).not.toHaveBeenCalled();
  });

  it('processes modified files', async () => {
    const filePath = join(testDir, 'modified.gpx');
    await writeFile(filePath, SAMPLE_GPX);

    // Create manifest with old checksum
    let manifest = createManifest();
    manifest = addFileEntry(manifest, filePath, 'old-checksum-that-does-not-match');
    manifest = updateFileStatus(manifest, filePath, 'processed');

    const options: SyncOptions = {
      inputDir: testDir,
      outputDir,
      manifest,
      processor: mockProcessor,
    };

    const result = await syncFiles(options);

    expect(result.processed).toBe(1);
    expect(result.modified).toBe(1);
    expect(mockProcessor).toHaveBeenCalledTimes(1);
  });

  it('processes multiple files', async () => {
    await writeFile(join(testDir, 'file1.gpx'), SAMPLE_GPX);
    await writeFile(join(testDir, 'file2.gpx'), SAMPLE_GPX_2);

    const options: SyncOptions = {
      inputDir: testDir,
      outputDir,
      manifest: createManifest(),
      processor: mockProcessor,
    };

    const result = await syncFiles(options);

    expect(result.processed).toBe(2);
    expect(mockProcessor).toHaveBeenCalledTimes(2);
  });

  it('tracks errors during processing', async () => {
    await writeFile(join(testDir, 'error.gpx'), SAMPLE_GPX);

    const failingProcessor: FileProcessor = vi.fn().mockRejectedValue(new Error('Parse failed'));

    const options: SyncOptions = {
      inputDir: testDir,
      outputDir,
      manifest: createManifest(),
      processor: failingProcessor,
    };

    const result = await syncFiles(options);

    expect(result.processed).toBe(0);
    expect(result.errors).toBe(1);
    expect(result.errorFiles).toHaveLength(1);
    expect(result.errorFiles[0]?.error).toBe('Parse failed');
  });

  it('returns updated manifest', async () => {
    await writeFile(join(testDir, 'new.gpx'), SAMPLE_GPX);

    const options: SyncOptions = {
      inputDir: testDir,
      outputDir,
      manifest: createManifest(),
      processor: mockProcessor,
    };

    const result = await syncFiles(options);
    const filePath = join(testDir, 'new.gpx');

    expect(result.manifest.files[filePath]).toBeDefined();
    expect(result.manifest.files[filePath]?.status).toBe('processed');
  });

  it('updates manifest for errors', async () => {
    const filePath = join(testDir, 'error.gpx');
    await writeFile(filePath, SAMPLE_GPX);

    const failingProcessor: FileProcessor = vi.fn().mockRejectedValue(new Error('Parse failed'));

    const options: SyncOptions = {
      inputDir: testDir,
      outputDir,
      manifest: createManifest(),
      processor: failingProcessor,
    };

    const result = await syncFiles(options);

    expect(result.manifest.files[filePath]?.status).toBe('error');
    expect(result.manifest.files[filePath]?.error).toBe('Parse failed');
  });

  it('provides summary of all file categories', async () => {
    const newFile = join(testDir, 'new.gpx');
    const unchangedFile = join(testDir, 'unchanged.gpx');
    const modifiedFile = join(testDir, 'modified.gpx');

    await writeFile(newFile, SAMPLE_GPX);
    await writeFile(unchangedFile, SAMPLE_GPX);
    await writeFile(modifiedFile, SAMPLE_GPX_2);

    // Set up manifest for unchanged and modified files
    let manifest = createManifest();
    const { calculateChecksum } = await import('../../manifest');
    const unchangedChecksum = await calculateChecksum(unchangedFile);
    manifest = addFileEntry(manifest, unchangedFile, unchangedChecksum);
    manifest = updateFileStatus(manifest, unchangedFile, 'processed');
    manifest = addFileEntry(manifest, modifiedFile, 'old-checksum');
    manifest = updateFileStatus(manifest, modifiedFile, 'processed');

    const options: SyncOptions = {
      inputDir: testDir,
      outputDir,
      manifest,
      processor: mockProcessor,
    };

    const result = await syncFiles(options);

    expect(result.total).toBe(3);
    expect(result.processed).toBe(2); // new + modified
    expect(result.skipped).toBe(1); // unchanged
    expect(result.newFiles).toBe(1);
    expect(result.modified).toBe(1);
  });
});

describe('edge cases', () => {
  let testDir: string;
  let outputDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `sync-test-${Date.now()}`);
    outputDir = join(testDir, 'output');
    await mkdir(testDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('handles empty directory', async () => {
    const mockProcessor: FileProcessor = vi.fn();

    const options: SyncOptions = {
      inputDir: testDir,
      outputDir,
      manifest: createManifest(),
      processor: mockProcessor,
    };

    const result = await syncFiles(options);

    expect(result.total).toBe(0);
    expect(result.processed).toBe(0);
    expect(mockProcessor).not.toHaveBeenCalled();
  });

  it('handles files with special characters in names', async () => {
    const specialName = 'Activity (1) - Morning Run.gpx';
    await writeFile(join(testDir, specialName), SAMPLE_GPX);

    const mockProcessor: FileProcessor = vi.fn().mockResolvedValue({ success: true });

    const options: SyncOptions = {
      inputDir: testDir,
      outputDir,
      manifest: createManifest(),
      processor: mockProcessor,
    };

    const result = await syncFiles(options);

    expect(result.processed).toBe(1);
  });
});
