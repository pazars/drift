/**
 * Sync command for incremental file processing.
 * @module commands/sync
 */

import fg from 'fast-glob';
import {
  type ProcessingManifest,
  addFileEntry,
  updateFileStatus,
  calculateChecksum,
  needsProcessing,
  getFileEntry,
} from '../manifest/index.js';

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
 * Options for the sync operation.
 */
export interface SyncOptions {
  /** Directory to scan for GPX files */
  inputDir: string;
  /** Directory for output files */
  outputDir: string;
  /** Current manifest state */
  manifest: ProcessingManifest;
  /** Function to process each file */
  processor: FileProcessor;
}

/**
 * Information about a file that had an error.
 */
export interface ErrorFileInfo {
  /** Path to the file */
  path: string;
  /** Error message */
  error: string;
}

/**
 * Result of a sync operation.
 */
export interface SyncResult {
  /** Total number of files found */
  total: number;
  /** Number of files processed (new + modified) */
  processed: number;
  /** Number of files skipped (unchanged) */
  skipped: number;
  /** Number of files with errors */
  errors: number;
  /** Number of new files */
  newFiles: number;
  /** Number of modified files */
  modified: number;
  /** Files that had errors */
  errorFiles: ErrorFileInfo[];
  /** Updated manifest */
  manifest: ProcessingManifest;
}

/**
 * Scan a directory for GPX files.
 *
 * @param dir - Directory to scan
 * @returns Array of absolute paths to GPX files
 */
export async function scanDirectory(dir: string): Promise<string[]> {
  const pattern = '**/*.gpx';
  const files = await fg(pattern, {
    cwd: dir,
    absolute: true,
    onlyFiles: true,
    caseSensitiveMatch: false,
  });
  return files;
}

/**
 * Sync files in a directory, processing only new or changed files.
 *
 * @param options - Sync options
 * @returns Sync result with statistics and updated manifest
 */
export async function syncFiles(options: SyncOptions): Promise<SyncResult> {
  const { inputDir, outputDir, processor } = options;
  let manifest = options.manifest;

  // Scan for GPX files
  const files = await scanDirectory(inputDir);

  const result: SyncResult = {
    total: files.length,
    processed: 0,
    skipped: 0,
    errors: 0,
    newFiles: 0,
    modified: 0,
    errorFiles: [],
    manifest,
  };

  // Process each file
  for (const filePath of files) {
    // Calculate current checksum
    const checksum = await calculateChecksum(filePath);

    // Check if file needs processing
    const existingEntry = getFileEntry(manifest, filePath);
    const isNew = !existingEntry;
    const isModified = existingEntry && existingEntry.checksum !== checksum;

    if (!needsProcessing(manifest, filePath, checksum)) {
      // File unchanged, skip
      result.skipped++;
      continue;
    }

    // Add/update file entry in manifest
    manifest = addFileEntry(manifest, filePath, checksum);

    // Mark as processing
    manifest = updateFileStatus(manifest, filePath, 'processing');

    try {
      // Process the file
      const processResult = await processor(filePath, outputDir);

      if (processResult.success) {
        // Update manifest with success
        manifest = updateFileStatus(manifest, filePath, 'processed');
        result.processed++;

        if (isNew) {
          result.newFiles++;
        } else if (isModified) {
          result.modified++;
        }
      } else {
        // Processing returned failure
        const error = processResult.error ?? 'Unknown error';
        manifest = updateFileStatus(manifest, filePath, 'error', error);
        result.errors++;
        result.errorFiles.push({ path: filePath, error });
      }
    } catch (err) {
      // Processing threw an error
      const error = err instanceof Error ? err.message : String(err);
      manifest = updateFileStatus(manifest, filePath, 'error', error);
      result.errors++;
      result.errorFiles.push({ path: filePath, error });
    }
  }

  result.manifest = manifest;
  return result;
}
