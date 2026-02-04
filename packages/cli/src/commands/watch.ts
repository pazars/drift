/**
 * Watch command for auto-processing new files.
 * @module commands/watch
 */

import { watch, type FSWatcher } from 'chokidar';
import { EventEmitter } from 'node:events';
import { resolve } from 'node:path';

/**
 * Result of processing a single file.
 */
export interface ProcessResult {
  /** Whether processing succeeded */
  success: boolean;
  /** Output file path (if successful) */
  outputPath?: string;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Function type for processing a single GPX file.
 */
export type FileProcessor = (inputPath: string, outputDir: string) => Promise<ProcessResult>;

/**
 * Options for the watch command.
 */
export interface WatchOptions {
  /** Directory to watch for GPX files */
  inputDir: string;
  /** Directory for output files */
  outputDir: string;
  /** Function to process each file */
  processor: FileProcessor;
  /** Debounce delay in milliseconds (default: 200) */
  debounceMs?: number;
}

/**
 * Events emitted by the watcher.
 */
export interface WatcherEvents {
  /** Emitted when watcher is ready */
  ready: () => void;
  /** Emitted when a file is processed successfully */
  processed: (path: string, result: ProcessResult) => void;
  /** Emitted when processing fails */
  error: (path: string, error: Error) => void;
}

/**
 * Handle for controlling the watcher.
 */
export interface WatcherHandle {
  /** Event emitter for watch events */
  events: EventEmitter;
  /** Stop watching and clean up */
  stop: () => Promise<void>;
}

/** Default debounce delay */
const DEFAULT_DEBOUNCE_MS = 200;

/**
 * Create a file watcher that auto-processes new GPX files.
 *
 * @param options - Watch options
 * @returns Watcher handle with events and stop method
 */
export function createWatcher(options: WatchOptions): WatcherHandle {
  const { inputDir, outputDir, processor, debounceMs = DEFAULT_DEBOUNCE_MS } = options;

  const events = new EventEmitter();
  const absoluteInputDir = resolve(inputDir);

  // Track pending processing to avoid duplicates
  const processing = new Set<string>();

  // Create chokidar watcher - watch the directory, filter in handler
  const watcher: FSWatcher = watch(absoluteInputDir, {
    persistent: true,
    ignoreInitial: true, // Don't process existing files
    awaitWriteFinish: {
      stabilityThreshold: debounceMs,
      pollInterval: 50,
    },
    depth: 99, // Watch subdirectories
  });

  // Handle new files and changes
  const handleFile = async (filePath: string): Promise<void> => {
    // Skip if already processing
    if (processing.has(filePath)) {
      return;
    }

    // Only process .gpx files (case-insensitive)
    if (!filePath.toLowerCase().endsWith('.gpx')) {
      return;
    }

    processing.add(filePath);

    try {
      const result = await processor(filePath, outputDir);
      events.emit('processed', filePath, result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      events.emit('error', filePath, error);
    } finally {
      processing.delete(filePath);
    }
  };

  // Set up event handlers - wrap async handler to avoid Promise return in void context
  const safeHandleFile = (filePath: string): void => {
    void handleFile(filePath);
  };
  watcher.on('add', safeHandleFile);
  watcher.on('change', safeHandleFile);
  watcher.on('ready', () => events.emit('ready'));
  watcher.on('error', (err) => events.emit('error', '', err));

  // Create handle
  const handle: WatcherHandle = {
    events,
    stop: async () => {
      await watcher.close();
    },
  };

  return handle;
}
