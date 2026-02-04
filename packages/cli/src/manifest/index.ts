/**
 * Processing manifest for tracking file changes and processing status.
 * @module manifest
 */

import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

/** Current manifest schema version */
const MANIFEST_VERSION = 1;

/** Default pipeline version */
const DEFAULT_PIPELINE_VERSION = '1.0.0';

/** Processing status for a file */
export type FileStatus = 'pending' | 'processing' | 'processed' | 'error';

/**
 * Entry for a tracked file in the manifest.
 */
export interface FileEntry {
  /** SHA-256 checksum of the file */
  checksum: string;
  /** Current processing status */
  status: FileStatus;
  /** When the file was first added to manifest */
  addedAt: Date;
  /** When the file was last processed (if processed) */
  processedAt?: Date;
  /** Error message if status is 'error' */
  error?: string;
  /** Output file path (if processed) */
  outputPath?: string;
}

/**
 * Processing manifest tracking all source files.
 */
export interface ProcessingManifest {
  /** Manifest schema version */
  version: number;
  /** Processing pipeline version */
  pipelineVersion: string;
  /** When manifest was created */
  createdAt: Date;
  /** When manifest was last updated */
  updatedAt: Date;
  /** Map of file paths to their entries */
  files: Record<string, FileEntry>;
}

/**
 * Options for creating a new manifest.
 */
export interface CreateManifestOptions {
  /** Pipeline version string */
  pipelineVersion?: string;
}

/**
 * Create a new empty processing manifest.
 *
 * @param options - Optional configuration
 * @returns New manifest instance
 */
export function createManifest(options?: CreateManifestOptions): ProcessingManifest {
  const now = new Date();
  return {
    version: MANIFEST_VERSION,
    pipelineVersion: options?.pipelineVersion ?? DEFAULT_PIPELINE_VERSION,
    createdAt: now,
    updatedAt: now,
    files: {},
  };
}

/**
 * Add or update a file entry in the manifest.
 *
 * If the file exists and checksum changed, status resets to 'pending'.
 * If checksum is unchanged, existing status is preserved.
 *
 * @param manifest - Current manifest
 * @param filePath - Path to the source file
 * @param checksum - SHA-256 checksum of the file
 * @returns Updated manifest
 */
export function addFileEntry(
  manifest: ProcessingManifest,
  filePath: string,
  checksum: string
): ProcessingManifest {
  const existing = manifest.files[filePath];
  const now = new Date();

  let entry: FileEntry;

  if (existing) {
    if (existing.checksum === checksum) {
      // Checksum unchanged, preserve existing entry
      entry = existing;
    } else {
      // Checksum changed, reset to pending
      entry = {
        checksum,
        status: 'pending',
        addedAt: existing.addedAt,
      };
    }
  } else {
    // New file
    entry = {
      checksum,
      status: 'pending',
      addedAt: now,
    };
  }

  return {
    ...manifest,
    updatedAt: now,
    files: {
      ...manifest.files,
      [filePath]: entry,
    },
  };
}

/**
 * Update the processing status of a file.
 *
 * @param manifest - Current manifest
 * @param filePath - Path to the file
 * @param status - New status
 * @param error - Optional error message (for 'error' status)
 * @returns Updated manifest
 * @throws If file does not exist in manifest
 */
export function updateFileStatus(
  manifest: ProcessingManifest,
  filePath: string,
  status: FileStatus,
  error?: string
): ProcessingManifest {
  const existing = manifest.files[filePath];

  if (!existing) {
    throw new Error(`File not found in manifest: ${filePath}`);
  }

  const now = new Date();

  const entry: FileEntry = {
    ...existing,
    status,
    ...(status === 'processed' && { processedAt: now }),
    ...(status === 'error' && error && { error }),
  };

  // Clear error if status is not error
  if (status !== 'error') {
    delete entry.error;
  }

  return {
    ...manifest,
    updatedAt: now,
    files: {
      ...manifest.files,
      [filePath]: entry,
    },
  };
}

/**
 * Get a file entry from the manifest.
 *
 * @param manifest - Current manifest
 * @param filePath - Path to the file
 * @returns File entry or undefined if not found
 */
export function getFileEntry(
  manifest: ProcessingManifest,
  filePath: string
): FileEntry | undefined {
  return manifest.files[filePath];
}

/**
 * Get all file paths with a specific status.
 *
 * @param manifest - Current manifest
 * @param status - Status to filter by
 * @returns Array of file paths
 */
export function getFilesByStatus(manifest: ProcessingManifest, status: FileStatus): string[] {
  return Object.entries(manifest.files)
    .filter(([, entry]) => entry.status === status)
    .map(([path]) => path);
}

/**
 * Check if a file needs processing.
 *
 * A file needs processing if:
 * - It's not in the manifest (new file)
 * - Its checksum has changed
 * - Its status is not 'processed'
 *
 * @param manifest - Current manifest
 * @param filePath - Path to the file
 * @param checksum - Current checksum of the file
 * @returns True if file needs processing
 */
export function needsProcessing(
  manifest: ProcessingManifest,
  filePath: string,
  checksum: string
): boolean {
  const entry = manifest.files[filePath];

  // New file
  if (!entry) {
    return true;
  }

  // Checksum changed
  if (entry.checksum !== checksum) {
    return true;
  }

  // Not yet processed or had error
  if (entry.status !== 'processed') {
    return true;
  }

  return false;
}

/**
 * Calculate SHA-256 checksum of a file.
 *
 * @param filePath - Path to the file
 * @returns Hex-encoded SHA-256 checksum
 */
export function calculateChecksum(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Serialized form of the manifest (for JSON storage).
 */
interface SerializedManifest {
  version: number;
  pipelineVersion: string;
  createdAt: string;
  updatedAt: string;
  files: Record<string, SerializedFileEntry>;
}

/**
 * Serialized form of a file entry.
 */
interface SerializedFileEntry {
  checksum: string;
  status: FileStatus;
  addedAt: string;
  processedAt?: string;
  error?: string;
  outputPath?: string;
}

/**
 * Save manifest to a JSON file.
 *
 * @param manifest - Manifest to save
 * @param filePath - Path to save to
 */
export async function saveManifest(manifest: ProcessingManifest, filePath: string): Promise<void> {
  const serialized: SerializedManifest = {
    version: manifest.version,
    pipelineVersion: manifest.pipelineVersion,
    createdAt: manifest.createdAt.toISOString(),
    updatedAt: manifest.updatedAt.toISOString(),
    files: Object.fromEntries(
      Object.entries(manifest.files).map(([path, entry]) => [
        path,
        {
          checksum: entry.checksum,
          status: entry.status,
          addedAt: entry.addedAt.toISOString(),
          ...(entry.processedAt && { processedAt: entry.processedAt.toISOString() }),
          ...(entry.error && { error: entry.error }),
          ...(entry.outputPath && { outputPath: entry.outputPath }),
        },
      ])
    ),
  };

  await writeFile(filePath, JSON.stringify(serialized, null, 2));
}

/**
 * Load manifest from a JSON file.
 *
 * Returns an empty manifest if the file doesn't exist.
 *
 * @param filePath - Path to load from
 * @returns Loaded manifest
 */
export async function loadManifest(filePath: string): Promise<ProcessingManifest> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const serialized = JSON.parse(content) as SerializedManifest;

    return {
      version: serialized.version,
      pipelineVersion: serialized.pipelineVersion,
      createdAt: new Date(serialized.createdAt),
      updatedAt: new Date(serialized.updatedAt),
      files: Object.fromEntries(
        Object.entries(serialized.files).map(([path, entry]) => [
          path,
          {
            checksum: entry.checksum,
            status: entry.status,
            addedAt: new Date(entry.addedAt),
            ...(entry.processedAt && { processedAt: new Date(entry.processedAt) }),
            ...(entry.error && { error: entry.error }),
            ...(entry.outputPath && { outputPath: entry.outputPath }),
          },
        ])
      ),
    };
  } catch (error) {
    // Return empty manifest if file doesn't exist or is invalid
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return createManifest();
    }
    throw error;
  }
}
