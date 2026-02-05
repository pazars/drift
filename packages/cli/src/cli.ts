/**
 * CLI entry point using Commander.js.
 * @module cli
 */

/* eslint-disable no-console */

import { Command } from 'commander';
import { join } from 'node:path';
import { processGpxFile } from './processor';
import { syncFiles, type FileProcessor, type ProcessResult } from './commands/sync';
import { buildIndex } from './commands/build-index';
import { createManifest, loadManifest, saveManifest } from './manifest';
import {
  loadTagStore,
  saveTagStore,
  batchAddTag,
  batchRemoveTag,
  getFileTags,
  getTagDefinitions,
  defineTag,
} from './commands/tag';
import { createWatcher, type ProcessResult as WatchProcessResult } from './commands/watch';

/**
 * Configuration for creating the CLI.
 */
export interface CliConfig {
  /** Program version */
  version: string;
  /** Program name */
  name: string;
}

/**
 * Create a file processor function for use with sync and watch commands.
 */
function createProcessor(): FileProcessor {
  return async (inputPath: string, outputDir: string): Promise<ProcessResult> => {
    try {
      const result = await processGpxFile({ inputPath, outputDir });
      return {
        success: true,
        ...(result.metadata.geometryFile && { outputPath: result.metadata.geometryFile }),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };
}

/**
 * Create the CLI with all commands.
 * @param config - CLI configuration
 * @returns Configured Command instance
 */
export function createCli(config: CliConfig): Command {
  const program = new Command();

  program.name(config.name).version(config.version).description('GPX file processing CLI');

  // Process command - batch processing (alias for sync --force)
  program
    .command('process')
    .description('Batch process GPX files (alias for sync --force)')
    .requiredOption('-i, --input <dir>', 'Input directory containing GPX files')
    .requiredOption('-o, --output <dir>', 'Output directory for processed files')
    .option('-f, --format <format>', 'Output format (flatgeobuf, polyline)', 'flatgeobuf')
    .action(async (options: { input: string; output: string; format?: string }) => {
      // Process is just sync with --force
      const manifestPath = join(options.output, '.manifest.json');
      const processor = createProcessor();

      // Create fresh manifest (force reprocess all)
      const manifest = createManifest();

      // Sync files
      const result = await syncFiles({
        inputDir: options.input,
        outputDir: options.output,
        manifest,
        processor,
      });

      // Save manifest
      await saveManifest(result.manifest, manifestPath);

      // Build index
      await buildIndex(options.output);

      // Print summary
      console.log(`Processed ${result.processed} files (${result.errors} errors)`);
    });

  // Sync command - incremental processing
  program
    .command('sync')
    .description('Sync and incrementally process changed GPX files')
    .requiredOption('-i, --input <dir>', 'Input directory to scan')
    .requiredOption('-o, --output <dir>', 'Output directory for processed files')
    .option('--force', 'Force reprocessing of all files')
    .action(async (options: { input: string; output: string; force?: boolean }) => {
      const manifestPath = join(options.output, '.manifest.json');
      const processor = createProcessor();

      // Load existing manifest or create new (create new if --force)
      const manifest = options.force ? createManifest() : await loadManifest(manifestPath);

      // Sync files
      const result = await syncFiles({
        inputDir: options.input,
        outputDir: options.output,
        manifest,
        processor,
      });

      // Save manifest
      await saveManifest(result.manifest, manifestPath);

      // Build index
      await buildIndex(options.output);

      // Print summary
      console.log(
        `Sync complete: ${result.processed} processed, ${result.skipped} skipped, ${result.errors} errors`
      );
    });

  // Watch command - file watching
  program
    .command('watch')
    .description('Watch directory for new GPX files and process automatically')
    .requiredOption('-i, --input <dir>', 'Input directory to watch')
    .requiredOption('-o, --output <dir>', 'Output directory for processed files')
    .option('-d, --debounce <ms>', 'Debounce delay in milliseconds', '200')
    .action(async (options: { input: string; output: string; debounce?: string }) => {
      const processor = createProcessor();
      const debounceMs = parseInt(options.debounce ?? '200', 10);

      console.log(`Watching ${options.input} for new GPX files...`);

      const watcher = createWatcher({
        inputDir: options.input,
        outputDir: options.output,
        processor,
        debounceMs,
      });

      // Handle processed events - wrap async handler to avoid Promise return
      watcher.events.on('processed', (path: string, result: WatchProcessResult) => {
        void (async () => {
          if (result.success) {
            console.log(`Processed: ${path}`);
            // Rebuild index after each file
            await buildIndex(options.output);
          } else {
            console.error(`Error processing ${path}: ${result.error}`);
          }
        })();
      });

      // Handle errors
      watcher.events.on('error', (path: string, error: Error) => {
        console.error(`Error processing ${path}: ${error.message}`);
      });

      // Handle ready
      watcher.events.on('ready', () => {
        console.log('Watcher ready');
      });

      // Handle graceful shutdown - wrap async to avoid Promise return
      const shutdown = (): void => {
        console.log('\nStopping watcher...');
        void watcher.stop().then(() => process.exit(0));
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

      // Keep process alive
      await new Promise(() => {
        // Never resolves - process stays alive until signal
      });
    });

  // Tag command - file tagging
  const tagCommand = program.command('tag').description('Manage tags on GPX files');

  tagCommand
    .command('add')
    .description('Add a tag to one or more files')
    .argument('<tag>', 'Tag to add')
    .argument('<files...>', 'Files to tag')
    .option('--tags-file <path>', 'Path to tags.json file')
    .action(async (tag: string, files: string[], options: { tagsFile?: string }) => {
      const tagsFile = options.tagsFile ?? 'tags.json';
      let store = await loadTagStore(tagsFile);
      store = batchAddTag(store, files, tag);
      await saveTagStore(store, tagsFile);
      console.log(`Added tag "${tag}" to ${files.length} file(s)`);
    });

  tagCommand
    .command('remove')
    .description('Remove a tag from one or more files')
    .argument('<tag>', 'Tag to remove')
    .argument('<files...>', 'Files to untag')
    .option('--tags-file <path>', 'Path to tags.json file')
    .action(async (tag: string, files: string[], options: { tagsFile?: string }) => {
      const tagsFile = options.tagsFile ?? 'tags.json';
      let store = await loadTagStore(tagsFile);
      store = batchRemoveTag(store, files, tag);
      await saveTagStore(store, tagsFile);
      console.log(`Removed tag "${tag}" from ${files.length} file(s)`);
    });

  tagCommand
    .command('list')
    .description('List tags for files or all files with a tag')
    .argument('[file]', 'File to list tags for (or omit to list all tags)')
    .option('--tags-file <path>', 'Path to tags.json file')
    .action(async (file: string | undefined, options: { tagsFile?: string }) => {
      const tagsFile = options.tagsFile ?? 'tags.json';
      const store = await loadTagStore(tagsFile);

      if (file) {
        // List tags for a specific file
        const tags = getFileTags(store, file);
        if (tags.length === 0) {
          console.log(`No tags for "${file}"`);
        } else {
          console.log(`Tags for "${file}": ${tags.join(', ')}`);
        }
      } else {
        // List all tag definitions
        const definitions = getTagDefinitions(store);
        const tagNames = Object.keys(definitions);

        if (tagNames.length === 0) {
          console.log('No tags defined');
        } else {
          console.log('Defined tags:');
          for (const name of tagNames) {
            const def = definitions[name];
            const desc = def?.description ? ` - ${def.description}` : '';
            console.log(`  ${name} (${def?.color})${desc}`);
          }
        }
      }
    });

  tagCommand
    .command('define')
    .description('Define a tag with color and description')
    .argument('<tag>', 'Tag name to define')
    .option('-c, --color <hex>', 'Color in hex format (e.g., #4CAF50)', '#808080')
    .option('-d, --description <text>', 'Description of the tag')
    .option('--tags-file <path>', 'Path to tags.json file')
    .action(
      async (
        tag: string,
        options: {
          color?: string;
          description?: string;
          tagsFile?: string;
        }
      ) => {
        const tagsFile = options.tagsFile ?? 'tags.json';
        let store = await loadTagStore(tagsFile);
        store = defineTag(store, tag, {
          color: options.color ?? '#808080',
          ...(options.description && { description: options.description }),
        });
        await saveTagStore(store, tagsFile);
        console.log(`Defined tag "${tag}"`);
      }
    );

  // Rebuild index command
  program
    .command('rebuild-index')
    .description('Rebuild the metadata index from processed files')
    .requiredOption('-o, --output <dir>', 'Directory containing processed files')
    .action(async (options: { output: string }) => {
      await buildIndex(options.output);
      console.log(`Index rebuilt at ${join(options.output, 'index.json')}`);
    });

  return program;
}
