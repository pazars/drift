import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { EventEmitter } from 'node:events';
import { createWatcher, type WatchOptions, type FileProcessor, type WatcherHandle } from '../watch';

// Sample GPX content for testing
const SAMPLE_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <trk>
    <name>Test Track</name>
    <trkseg>
      <trkpt lat="37.7749" lon="-122.4194">
        <ele>100</ele>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

describe('createWatcher', () => {
  let testDir: string;
  let outputDir: string;
  let handle: WatcherHandle | null = null;

  beforeEach(async () => {
    testDir = join(tmpdir(), `watch-test-${Date.now()}`);
    outputDir = join(testDir, 'output');
    await mkdir(testDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });
  });

  afterEach(async () => {
    // Always stop the watcher if it exists
    if (handle) {
      await handle.stop();
      handle = null;
    }
    await rm(testDir, { recursive: true, force: true });
  });

  it('returns a watcher handle with stop method', () => {
    const mockProcessor: FileProcessor = vi.fn().mockResolvedValue({ success: true });

    const options: WatchOptions = {
      inputDir: testDir,
      outputDir,
      processor: mockProcessor,
    };

    handle = createWatcher(options);

    expect(handle).toHaveProperty('stop');
    expect(typeof handle.stop).toBe('function');
  });

  it('returns event emitter for listening to events', () => {
    const mockProcessor: FileProcessor = vi.fn().mockResolvedValue({ success: true });

    const options: WatchOptions = {
      inputDir: testDir,
      outputDir,
      processor: mockProcessor,
    };

    handle = createWatcher(options);

    expect(handle.events).toBeInstanceOf(EventEmitter);
  });

  it('emits ready event when watching starts', async () => {
    const mockProcessor: FileProcessor = vi.fn().mockResolvedValue({ success: true });

    const options: WatchOptions = {
      inputDir: testDir,
      outputDir,
      processor: mockProcessor,
    };

    handle = createWatcher(options);

    const readyPromise = new Promise<void>((resolve) => {
      handle!.events.on('ready', resolve);
    });

    await expect(readyPromise).resolves.toBeUndefined();
  });

  it('processes new GPX files', async () => {
    const mockProcessor: FileProcessor = vi.fn().mockResolvedValue({ success: true });

    const options: WatchOptions = {
      inputDir: testDir,
      outputDir,
      processor: mockProcessor,
      debounceMs: 50, // Short debounce for tests
    };

    handle = createWatcher(options);

    // Wait for watcher to be ready
    await new Promise<void>((resolve) => {
      handle!.events.on('ready', resolve);
    });

    // Set up event listener before writing file
    const processedPromise = new Promise<string>((resolve) => {
      handle!.events.on('processed', (path: string) => {
        resolve(path);
      });
    });

    // Create new file
    const filePath = join(testDir, 'new-activity.gpx');
    await writeFile(filePath, SAMPLE_GPX);

    // Wait for processing with timeout
    const processedPath = await processedPromise;

    expect(processedPath).toBe(filePath);
    expect(mockProcessor).toHaveBeenCalledWith(filePath, outputDir);
  }, 10000);

  it('emits processed event with result', async () => {
    const mockProcessor: FileProcessor = vi.fn().mockResolvedValue({
      success: true,
      outputPath: '/output/file.fgb',
    });

    const options: WatchOptions = {
      inputDir: testDir,
      outputDir,
      processor: mockProcessor,
      debounceMs: 50,
    };

    handle = createWatcher(options);

    await new Promise<void>((resolve) => {
      handle!.events.on('ready', resolve);
    });

    const eventPromise = new Promise<{ path: string; result: unknown }>((resolve) => {
      handle!.events.on('processed', (path: string, result: unknown) => {
        resolve({ path, result });
      });
    });

    await writeFile(join(testDir, 'test.gpx'), SAMPLE_GPX);

    const event = await eventPromise;
    expect(event.result).toEqual({ success: true, outputPath: '/output/file.fgb' });
  }, 10000);

  it('emits error event on processing failure', async () => {
    const mockProcessor: FileProcessor = vi.fn().mockRejectedValue(new Error('Parse failed'));

    const options: WatchOptions = {
      inputDir: testDir,
      outputDir,
      processor: mockProcessor,
      debounceMs: 50,
    };

    handle = createWatcher(options);

    await new Promise<void>((resolve) => {
      handle!.events.on('ready', resolve);
    });

    const errorPromise = new Promise<{ path: string; error: Error }>((resolve) => {
      handle!.events.on('error', (path: string, error: Error) => {
        resolve({ path, error });
      });
    });

    await writeFile(join(testDir, 'error.gpx'), SAMPLE_GPX);

    const event = await errorPromise;
    expect(event.error.message).toBe('Parse failed');
  }, 10000);

  it('ignores non-GPX files', async () => {
    const mockProcessor: FileProcessor = vi.fn().mockResolvedValue({ success: true });

    const options: WatchOptions = {
      inputDir: testDir,
      outputDir,
      processor: mockProcessor,
      debounceMs: 50,
    };

    handle = createWatcher(options);

    await new Promise<void>((resolve) => {
      handle!.events.on('ready', resolve);
    });

    // Create non-GPX file
    await writeFile(join(testDir, 'readme.txt'), 'text file');

    // Wait a bit to ensure it would have been processed if it matched
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(mockProcessor).not.toHaveBeenCalled();
  });

  it('watches subdirectories', async () => {
    const mockProcessor: FileProcessor = vi.fn().mockResolvedValue({ success: true });

    const subdir = join(testDir, 'subdir');
    await mkdir(subdir, { recursive: true });

    const options: WatchOptions = {
      inputDir: testDir,
      outputDir,
      processor: mockProcessor,
      debounceMs: 50,
    };

    handle = createWatcher(options);

    await new Promise<void>((resolve) => {
      handle!.events.on('ready', resolve);
    });

    const processedPromise = new Promise<void>((resolve) => {
      handle!.events.on('processed', resolve);
    });

    await writeFile(join(subdir, 'nested.gpx'), SAMPLE_GPX);

    await processedPromise;

    expect(mockProcessor).toHaveBeenCalled();
  }, 10000);

  it('debounces rapid file changes', async () => {
    const mockProcessor: FileProcessor = vi.fn().mockResolvedValue({ success: true });

    const options: WatchOptions = {
      inputDir: testDir,
      outputDir,
      processor: mockProcessor,
      debounceMs: 200, // Longer debounce for CI stability
    };

    handle = createWatcher(options);

    await new Promise<void>((resolve) => {
      handle!.events.on('ready', resolve);
    });

    const processedPromise = new Promise<void>((resolve) => {
      handle!.events.on('processed', resolve);
    });

    const filePath = join(testDir, 'debounce-test.gpx');

    // Write multiple times rapidly (within debounce window)
    await writeFile(filePath, SAMPLE_GPX);
    await new Promise((resolve) => setTimeout(resolve, 20));
    await writeFile(filePath, SAMPLE_GPX + '\n');
    await new Promise((resolve) => setTimeout(resolve, 20));
    await writeFile(filePath, SAMPLE_GPX + '\n\n');

    // Wait for debounced processing
    await processedPromise;

    // Give extra delay (longer than debounce) to ensure no additional calls happen
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Should only be called once due to debouncing
    expect(mockProcessor).toHaveBeenCalledTimes(1);
  }, 10000);

  it('stops cleanly without errors', async () => {
    const mockProcessor: FileProcessor = vi.fn().mockResolvedValue({ success: true });

    const options: WatchOptions = {
      inputDir: testDir,
      outputDir,
      processor: mockProcessor,
    };

    handle = createWatcher(options);

    await new Promise<void>((resolve) => {
      handle!.events.on('ready', resolve);
    });

    // Should not throw - handle is narrowed to WatcherHandle after assignment
    await expect(handle.stop()).resolves.toBeUndefined();
    handle = null; // Mark as stopped to prevent afterEach from double-stopping
  });
});
