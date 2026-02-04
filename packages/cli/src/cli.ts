/**
 * CLI entry point using Commander.js.
 * @module cli
 */

import { Command } from 'commander';

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
 * Create the CLI with all commands.
 * @param config - CLI configuration
 * @returns Configured Command instance
 */
export function createCli(config: CliConfig): Command {
  const program = new Command();

  program.name(config.name).version(config.version).description('GPX file processing CLI');

  // Process command - batch processing
  program
    .command('process')
    .description('Batch process GPX files')
    .option('-i, --input <dir>', 'Input directory containing GPX files')
    .option('-o, --output <dir>', 'Output directory for processed files')
    .option('-f, --format <format>', 'Output format (flatgeobuf, polyline)', 'flatgeobuf')
    .action((options: { input?: string; output?: string; format?: string }) => {
      console.log('Processing files...', options);
      // TODO: Wire up actual processing logic
    });

  // Sync command - incremental processing
  program
    .command('sync')
    .description('Sync and incrementally process changed GPX files')
    .option('-i, --input <dir>', 'Input directory to scan')
    .option('-o, --output <dir>', 'Output directory for processed files')
    .option('--force', 'Force reprocessing of all files')
    .action((options: { input?: string; output?: string; force?: boolean }) => {
      console.log('Syncing files...', options);
      // TODO: Wire up actual sync logic
    });

  // Watch command - file watching
  program
    .command('watch')
    .description('Watch directory for new GPX files and process automatically')
    .option('-i, --input <dir>', 'Input directory to watch')
    .option('-o, --output <dir>', 'Output directory for processed files')
    .option('-d, --debounce <ms>', 'Debounce delay in milliseconds', '200')
    .action((options: { input?: string; output?: string; debounce?: string }) => {
      console.log('Watching for files...', options);
      // TODO: Wire up actual watch logic
    });

  // Tag command - file tagging
  const tagCommand = program.command('tag').description('Manage tags on GPX files');

  tagCommand
    .command('add')
    .description('Add a tag to one or more files')
    .argument('<tag>', 'Tag to add')
    .argument('<files...>', 'Files to tag')
    .option('--tags-file <path>', 'Path to tags.json file')
    .action((tag: string, files: string[], options: { tagsFile?: string }) => {
      console.log('Adding tag...', { tag, files, options });
      // TODO: Wire up actual tagging logic
    });

  tagCommand
    .command('remove')
    .description('Remove a tag from one or more files')
    .argument('<tag>', 'Tag to remove')
    .argument('<files...>', 'Files to untag')
    .option('--tags-file <path>', 'Path to tags.json file')
    .action((tag: string, files: string[], options: { tagsFile?: string }) => {
      console.log('Removing tag...', { tag, files, options });
      // TODO: Wire up actual tagging logic
    });

  tagCommand
    .command('list')
    .description('List tags for files or all files with a tag')
    .argument('[file]', 'File to list tags for (or omit to list all tags)')
    .option('--tags-file <path>', 'Path to tags.json file')
    .action((file: string | undefined, options: { tagsFile?: string }) => {
      console.log('Listing tags...', { file, options });
      // TODO: Wire up actual listing logic
    });

  tagCommand
    .command('define')
    .description('Define a tag with color and description')
    .argument('<tag>', 'Tag name to define')
    .option('-c, --color <hex>', 'Color in hex format (e.g., #4CAF50)')
    .option('-d, --description <text>', 'Description of the tag')
    .option('--tags-file <path>', 'Path to tags.json file')
    .action(
      (
        tag: string,
        options: {
          color?: string;
          description?: string;
          tagsFile?: string;
        }
      ) => {
        console.log('Defining tag...', { tag, options });
        // TODO: Wire up actual definition logic
      }
    );

  // Rebuild index command
  program
    .command('rebuild-index')
    .description('Rebuild the metadata index from processed files')
    .option('-i, --input <dir>', 'Directory containing processed files')
    .option('-o, --output <path>', 'Output path for the index file')
    .action((options: { input?: string; output?: string }) => {
      console.log('Rebuilding index...', options);
      // TODO: Wire up actual rebuild logic
    });

  return program;
}
