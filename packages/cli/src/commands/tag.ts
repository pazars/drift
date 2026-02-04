/**
 * Tagging system for GPX files.
 * @module commands/tag
 */

import { readFile, writeFile } from 'node:fs/promises';

/**
 * Definition of a tag with optional styling.
 */
export interface TagDefinition {
  /** Color for the tag (hex format) */
  color: string;
  /** Optional description of the tag */
  description?: string;
}

/**
 * Storage structure for tags.
 */
export interface TagStore {
  /** Map of file paths to their tags */
  fileTags: Record<string, string[]>;
  /** Map of tag names to their definitions */
  tagDefinitions: Record<string, TagDefinition>;
}

/** Valid tag name pattern: alphanumeric, hyphens, underscores */
const TAG_NAME_PATTERN = /^[a-z0-9_-]+$/;

/**
 * Validate and normalize a tag name.
 * @throws Error if tag name is invalid
 */
function normalizeTagName(tag: string): string {
  const normalized = tag.trim().toLowerCase();

  if (normalized.length === 0) {
    throw new Error('Tag name cannot be empty');
  }

  if (!TAG_NAME_PATTERN.test(normalized)) {
    throw new Error(
      `Invalid tag name: "${tag}". Tags can only contain letters, numbers, hyphens, and underscores.`
    );
  }

  return normalized;
}

/**
 * Create an empty tag store.
 */
export function createTagStore(): TagStore {
  return {
    fileTags: {},
    tagDefinitions: {},
  };
}

/**
 * Add a tag to a file.
 * @param store - Current tag store
 * @param filePath - Path to the file
 * @param tag - Tag to add
 * @returns Updated tag store
 */
export function addTag(store: TagStore, filePath: string, tag: string): TagStore {
  const normalizedTag = normalizeTagName(tag);
  const currentTags = store.fileTags[filePath] ?? [];

  // Don't add duplicate tags
  if (currentTags.includes(normalizedTag)) {
    return store;
  }

  return {
    ...store,
    fileTags: {
      ...store.fileTags,
      [filePath]: [...currentTags, normalizedTag],
    },
  };
}

/**
 * Remove a tag from a file.
 * @param store - Current tag store
 * @param filePath - Path to the file
 * @param tag - Tag to remove
 * @returns Updated tag store
 */
export function removeTag(store: TagStore, filePath: string, tag: string): TagStore {
  const currentTags = store.fileTags[filePath];

  // File has no tags
  if (!currentTags) {
    return store;
  }

  const normalizedTag = tag.trim().toLowerCase();
  const newTags = currentTags.filter((t) => t !== normalizedTag);

  // Remove file entry if no tags remain
  if (newTags.length === 0) {
    const { [filePath]: _, ...remainingFileTags } = store.fileTags;
    return {
      ...store,
      fileTags: remainingFileTags,
    };
  }

  return {
    ...store,
    fileTags: {
      ...store.fileTags,
      [filePath]: newTags,
    },
  };
}

/**
 * Get all tags for a file.
 * @param store - Tag store
 * @param filePath - Path to the file
 * @returns Array of tags (empty if file has no tags)
 */
export function getFileTags(store: TagStore, filePath: string): string[] {
  return store.fileTags[filePath] ?? [];
}

/**
 * Get all files with a specific tag.
 * @param store - Tag store
 * @param tag - Tag to search for
 * @returns Array of file paths
 */
export function getTaggedFiles(store: TagStore, tag: string): string[] {
  const normalizedTag = tag.trim().toLowerCase();

  return Object.entries(store.fileTags)
    .filter(([_, tags]) => tags.includes(normalizedTag))
    .map(([filePath]) => filePath);
}

/**
 * Define or update a tag's properties.
 * @param store - Current tag store
 * @param tag - Tag name
 * @param definition - Tag definition
 * @returns Updated tag store
 */
export function defineTag(store: TagStore, tag: string, definition: TagDefinition): TagStore {
  const normalizedTag = normalizeTagName(tag);

  return {
    ...store,
    tagDefinitions: {
      ...store.tagDefinitions,
      [normalizedTag]: definition,
    },
  };
}

/**
 * Get all tag definitions.
 * @param store - Tag store
 * @returns Map of tag names to definitions
 */
export function getTagDefinitions(store: TagStore): Record<string, TagDefinition> {
  return store.tagDefinitions;
}

/**
 * Add a tag to multiple files.
 * @param store - Current tag store
 * @param filePaths - Paths to files
 * @param tag - Tag to add
 * @returns Updated tag store
 */
export function batchAddTag(store: TagStore, filePaths: string[], tag: string): TagStore {
  return filePaths.reduce((acc, filePath) => addTag(acc, filePath, tag), store);
}

/**
 * Remove a tag from multiple files.
 * @param store - Current tag store
 * @param filePaths - Paths to files
 * @param tag - Tag to remove
 * @returns Updated tag store
 */
export function batchRemoveTag(store: TagStore, filePaths: string[], tag: string): TagStore {
  return filePaths.reduce((acc, filePath) => removeTag(acc, filePath, tag), store);
}

/**
 * Save tag store to a file.
 * @param store - Tag store to save
 * @param filePath - Path to save to
 */
export async function saveTagStore(store: TagStore, filePath: string): Promise<void> {
  const json = JSON.stringify(store, null, 2);
  await writeFile(filePath, json, 'utf-8');
}

/**
 * Load tag store from a file.
 * @param filePath - Path to load from
 * @returns Tag store (empty if file doesn't exist)
 */
export async function loadTagStore(filePath: string): Promise<TagStore> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as TagStore;
  } catch {
    // Return empty store if file doesn't exist
    return createTagStore();
  }
}
