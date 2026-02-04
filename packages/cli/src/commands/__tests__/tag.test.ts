import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  createTagStore,
  addTag,
  removeTag,
  getFileTags,
  getTaggedFiles,
  defineTag,
  getTagDefinitions,
  batchAddTag,
  batchRemoveTag,
  saveTagStore,
  loadTagStore,
  type TagStore,
} from '../tag';

describe('Tag Store', () => {
  let testDir: string;
  let tagsFile: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `tag-test-${Date.now()}`);
    tagsFile = join(testDir, 'tags.json');
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('createTagStore', () => {
    it('creates an empty tag store', () => {
      const store = createTagStore();

      expect(store.fileTags).toEqual({});
      expect(store.tagDefinitions).toEqual({});
    });
  });

  describe('addTag', () => {
    it('adds a tag to a file', () => {
      let store = createTagStore();

      store = addTag(store, '/path/to/activity.gpx', 'hiking');

      expect(store.fileTags['/path/to/activity.gpx']).toContain('hiking');
    });

    it('adds multiple tags to the same file', () => {
      let store = createTagStore();

      store = addTag(store, '/path/to/activity.gpx', 'hiking');
      store = addTag(store, '/path/to/activity.gpx', 'mountain');

      expect(store.fileTags['/path/to/activity.gpx']).toContain('hiking');
      expect(store.fileTags['/path/to/activity.gpx']).toContain('mountain');
    });

    it('does not duplicate tags', () => {
      let store = createTagStore();

      store = addTag(store, '/path/to/activity.gpx', 'hiking');
      store = addTag(store, '/path/to/activity.gpx', 'hiking');

      expect(store.fileTags['/path/to/activity.gpx']).toEqual(['hiking']);
    });

    it('normalizes tag names to lowercase', () => {
      let store = createTagStore();

      store = addTag(store, '/path/to/activity.gpx', 'Hiking');
      store = addTag(store, '/path/to/activity.gpx', 'MOUNTAIN');

      expect(store.fileTags['/path/to/activity.gpx']).toContain('hiking');
      expect(store.fileTags['/path/to/activity.gpx']).toContain('mountain');
    });
  });

  describe('removeTag', () => {
    it('removes a tag from a file', () => {
      let store = createTagStore();
      store = addTag(store, '/path/to/activity.gpx', 'hiking');
      store = addTag(store, '/path/to/activity.gpx', 'mountain');

      store = removeTag(store, '/path/to/activity.gpx', 'hiking');

      expect(store.fileTags['/path/to/activity.gpx']).not.toContain('hiking');
      expect(store.fileTags['/path/to/activity.gpx']).toContain('mountain');
    });

    it('handles removing non-existent tag gracefully', () => {
      let store = createTagStore();
      store = addTag(store, '/path/to/activity.gpx', 'hiking');

      store = removeTag(store, '/path/to/activity.gpx', 'nonexistent');

      expect(store.fileTags['/path/to/activity.gpx']).toEqual(['hiking']);
    });

    it('handles removing from non-existent file gracefully', () => {
      const store = createTagStore();

      const result = removeTag(store, '/nonexistent/file.gpx', 'hiking');

      expect(result.fileTags['/nonexistent/file.gpx']).toBeUndefined();
    });

    it('removes file entry when last tag is removed', () => {
      let store = createTagStore();
      store = addTag(store, '/path/to/activity.gpx', 'hiking');

      store = removeTag(store, '/path/to/activity.gpx', 'hiking');

      expect(store.fileTags['/path/to/activity.gpx']).toBeUndefined();
    });
  });

  describe('getFileTags', () => {
    it('returns tags for a file', () => {
      let store = createTagStore();
      store = addTag(store, '/path/to/activity.gpx', 'hiking');
      store = addTag(store, '/path/to/activity.gpx', 'mountain');

      const tags = getFileTags(store, '/path/to/activity.gpx');

      expect(tags).toContain('hiking');
      expect(tags).toContain('mountain');
    });

    it('returns empty array for untagged file', () => {
      const store = createTagStore();

      const tags = getFileTags(store, '/nonexistent/file.gpx');

      expect(tags).toEqual([]);
    });
  });

  describe('getTaggedFiles', () => {
    it('returns all files with a specific tag', () => {
      let store = createTagStore();
      store = addTag(store, '/path/to/activity1.gpx', 'hiking');
      store = addTag(store, '/path/to/activity2.gpx', 'hiking');
      store = addTag(store, '/path/to/activity3.gpx', 'cycling');

      const files = getTaggedFiles(store, 'hiking');

      expect(files).toContain('/path/to/activity1.gpx');
      expect(files).toContain('/path/to/activity2.gpx');
      expect(files).not.toContain('/path/to/activity3.gpx');
    });

    it('returns empty array for unused tag', () => {
      const store = createTagStore();

      const files = getTaggedFiles(store, 'nonexistent');

      expect(files).toEqual([]);
    });
  });

  describe('Tag Definitions', () => {
    it('defines a tag with color', () => {
      let store = createTagStore();

      store = defineTag(store, 'hiking', { color: '#4CAF50' });

      const definitions = getTagDefinitions(store);
      expect(definitions.hiking).toEqual({ color: '#4CAF50' });
    });

    it('defines a tag with color and description', () => {
      let store = createTagStore();

      store = defineTag(store, 'hiking', {
        color: '#4CAF50',
        description: 'Hiking and trekking activities',
      });

      const definitions = getTagDefinitions(store);
      expect(definitions.hiking?.description).toBe('Hiking and trekking activities');
    });

    it('normalizes tag name in definition', () => {
      let store = createTagStore();

      store = defineTag(store, 'HIKING', { color: '#4CAF50' });

      const definitions = getTagDefinitions(store);
      expect(definitions.hiking).toBeDefined();
      expect(definitions.HIKING).toBeUndefined();
    });

    it('updates existing tag definition', () => {
      let store = createTagStore();
      store = defineTag(store, 'hiking', { color: '#4CAF50' });

      store = defineTag(store, 'hiking', { color: '#2E7D32' });

      const definitions = getTagDefinitions(store);
      expect(definitions.hiking?.color).toBe('#2E7D32');
    });
  });

  describe('Batch Operations', () => {
    it('adds tag to multiple files', () => {
      let store = createTagStore();
      const files = ['/path/to/activity1.gpx', '/path/to/activity2.gpx', '/path/to/activity3.gpx'];

      store = batchAddTag(store, files, 'hiking');

      for (const file of files) {
        expect(store.fileTags[file]).toContain('hiking');
      }
    });

    it('removes tag from multiple files', () => {
      let store = createTagStore();
      const files = ['/path/to/activity1.gpx', '/path/to/activity2.gpx'];
      store = batchAddTag(store, files, 'hiking');

      store = batchRemoveTag(store, files, 'hiking');

      for (const file of files) {
        expect(store.fileTags[file]).toBeUndefined();
      }
    });
  });

  describe('Persistence', () => {
    it('saves tag store to file', async () => {
      let store = createTagStore();
      store = addTag(store, '/path/to/activity.gpx', 'hiking');
      store = defineTag(store, 'hiking', { color: '#4CAF50' });

      await saveTagStore(store, tagsFile);

      const content = await readFile(tagsFile, 'utf-8');
      const saved = JSON.parse(content) as TagStore;
      expect(saved.fileTags['/path/to/activity.gpx']).toContain('hiking');
      expect(saved.tagDefinitions.hiking?.color).toBe('#4CAF50');
    });

    it('loads tag store from file', async () => {
      const initial: TagStore = {
        fileTags: { '/path/to/activity.gpx': ['hiking', 'mountain'] },
        tagDefinitions: { hiking: { color: '#4CAF50' } },
      };
      await writeFile(tagsFile, JSON.stringify(initial));

      const store = await loadTagStore(tagsFile);

      expect(store.fileTags['/path/to/activity.gpx']).toContain('hiking');
      expect(store.fileTags['/path/to/activity.gpx']).toContain('mountain');
      expect(store.tagDefinitions.hiking?.color).toBe('#4CAF50');
    });

    it('returns empty store when file does not exist', async () => {
      const store = await loadTagStore(join(testDir, 'nonexistent.json'));

      expect(store.fileTags).toEqual({});
      expect(store.tagDefinitions).toEqual({});
    });
  });

  describe('Tag Validation', () => {
    it('rejects empty tag names', () => {
      const store = createTagStore();

      expect(() => addTag(store, '/path/to/file.gpx', '')).toThrow('Tag name cannot be empty');
    });

    it('rejects whitespace-only tag names', () => {
      const store = createTagStore();

      expect(() => addTag(store, '/path/to/file.gpx', '   ')).toThrow('Tag name cannot be empty');
    });

    it('trims whitespace from tag names', () => {
      let store = createTagStore();

      store = addTag(store, '/path/to/file.gpx', '  hiking  ');

      expect(store.fileTags['/path/to/file.gpx']).toContain('hiking');
    });

    it('rejects tags with special characters', () => {
      const store = createTagStore();

      expect(() => addTag(store, '/path/to/file.gpx', 'tag/name')).toThrow('Invalid tag name');
      expect(() => addTag(store, '/path/to/file.gpx', 'tag:name')).toThrow('Invalid tag name');
    });

    it('allows hyphens and underscores in tag names', () => {
      let store = createTagStore();

      store = addTag(store, '/path/to/file.gpx', 'trail-running');
      store = addTag(store, '/path/to/file.gpx', 'long_hike');

      expect(store.fileTags['/path/to/file.gpx']).toContain('trail-running');
      expect(store.fileTags['/path/to/file.gpx']).toContain('long_hike');
    });
  });
});
