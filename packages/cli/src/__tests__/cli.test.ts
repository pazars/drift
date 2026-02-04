import { describe, it, expect } from 'vitest';
import { createCli, type CliConfig } from '../cli';
import { Command } from 'commander';

describe('CLI', () => {
  const defaultConfig: CliConfig = {
    version: '1.0.0',
    name: 'gpx-cli',
  };

  describe('createCli', () => {
    it('creates a Command instance', () => {
      const cli = createCli(defaultConfig);

      expect(cli).toBeInstanceOf(Command);
    });

    it('sets the program name', () => {
      const cli = createCli(defaultConfig);

      expect(cli.name()).toBe('gpx-cli');
    });

    it('sets the program version', () => {
      const cli = createCli(defaultConfig);

      expect(cli.version()).toBe('1.0.0');
    });

    it('has process command', () => {
      const cli = createCli(defaultConfig);
      const processCmd = cli.commands.find((c) => c.name() === 'process');

      expect(processCmd).toBeDefined();
    });

    it('has sync command', () => {
      const cli = createCli(defaultConfig);
      const syncCmd = cli.commands.find((c) => c.name() === 'sync');

      expect(syncCmd).toBeDefined();
    });

    it('has watch command', () => {
      const cli = createCli(defaultConfig);
      const watchCmd = cli.commands.find((c) => c.name() === 'watch');

      expect(watchCmd).toBeDefined();
    });

    it('has tag command', () => {
      const cli = createCli(defaultConfig);
      const tagCmd = cli.commands.find((c) => c.name() === 'tag');

      expect(tagCmd).toBeDefined();
    });

    it('has rebuild-index command', () => {
      const cli = createCli(defaultConfig);
      const rebuildCmd = cli.commands.find((c) => c.name() === 'rebuild-index');

      expect(rebuildCmd).toBeDefined();
    });
  });

  describe('process command', () => {
    it('accepts input directory option', () => {
      const cli = createCli(defaultConfig);
      const processCmd = cli.commands.find((c) => c.name() === 'process');
      const inputOpt = processCmd?.options.find((o) => o.long === '--input');

      expect(inputOpt).toBeDefined();
    });

    it('accepts output directory option', () => {
      const cli = createCli(defaultConfig);
      const processCmd = cli.commands.find((c) => c.name() === 'process');
      const outputOpt = processCmd?.options.find((o) => o.long === '--output');

      expect(outputOpt).toBeDefined();
    });

    it('accepts format option', () => {
      const cli = createCli(defaultConfig);
      const processCmd = cli.commands.find((c) => c.name() === 'process');
      const formatOpt = processCmd?.options.find((o) => o.long === '--format');

      expect(formatOpt).toBeDefined();
    });
  });

  describe('sync command', () => {
    it('accepts input directory option', () => {
      const cli = createCli(defaultConfig);
      const syncCmd = cli.commands.find((c) => c.name() === 'sync');
      const inputOpt = syncCmd?.options.find((o) => o.long === '--input');

      expect(inputOpt).toBeDefined();
    });

    it('accepts output directory option', () => {
      const cli = createCli(defaultConfig);
      const syncCmd = cli.commands.find((c) => c.name() === 'sync');
      const outputOpt = syncCmd?.options.find((o) => o.long === '--output');

      expect(outputOpt).toBeDefined();
    });

    it('accepts force option', () => {
      const cli = createCli(defaultConfig);
      const syncCmd = cli.commands.find((c) => c.name() === 'sync');
      const forceOpt = syncCmd?.options.find((o) => o.long === '--force');

      expect(forceOpt).toBeDefined();
    });
  });

  describe('watch command', () => {
    it('accepts input directory option', () => {
      const cli = createCli(defaultConfig);
      const watchCmd = cli.commands.find((c) => c.name() === 'watch');
      const inputOpt = watchCmd?.options.find((o) => o.long === '--input');

      expect(inputOpt).toBeDefined();
    });

    it('accepts output directory option', () => {
      const cli = createCli(defaultConfig);
      const watchCmd = cli.commands.find((c) => c.name() === 'watch');
      const outputOpt = watchCmd?.options.find((o) => o.long === '--output');

      expect(outputOpt).toBeDefined();
    });

    it('accepts debounce option', () => {
      const cli = createCli(defaultConfig);
      const watchCmd = cli.commands.find((c) => c.name() === 'watch');
      const debounceOpt = watchCmd?.options.find((o) => o.long === '--debounce');

      expect(debounceOpt).toBeDefined();
    });
  });

  describe('tag command', () => {
    it('has add subcommand', () => {
      const cli = createCli(defaultConfig);
      const tagCmd = cli.commands.find((c) => c.name() === 'tag');
      const addCmd = tagCmd?.commands.find((c) => c.name() === 'add');

      expect(addCmd).toBeDefined();
    });

    it('has remove subcommand', () => {
      const cli = createCli(defaultConfig);
      const tagCmd = cli.commands.find((c) => c.name() === 'tag');
      const removeCmd = tagCmd?.commands.find((c) => c.name() === 'remove');

      expect(removeCmd).toBeDefined();
    });

    it('has list subcommand', () => {
      const cli = createCli(defaultConfig);
      const tagCmd = cli.commands.find((c) => c.name() === 'tag');
      const listCmd = tagCmd?.commands.find((c) => c.name() === 'list');

      expect(listCmd).toBeDefined();
    });

    it('has define subcommand', () => {
      const cli = createCli(defaultConfig);
      const tagCmd = cli.commands.find((c) => c.name() === 'tag');
      const defineCmd = tagCmd?.commands.find((c) => c.name() === 'define');

      expect(defineCmd).toBeDefined();
    });
  });

  describe('rebuild-index command', () => {
    it('accepts input directory option', () => {
      const cli = createCli(defaultConfig);
      const rebuildCmd = cli.commands.find((c) => c.name() === 'rebuild-index');
      const inputOpt = rebuildCmd?.options.find((o) => o.long === '--input');

      expect(inputOpt).toBeDefined();
    });

    it('accepts output option', () => {
      const cli = createCli(defaultConfig);
      const rebuildCmd = cli.commands.find((c) => c.name() === 'rebuild-index');
      const outputOpt = rebuildCmd?.options.find((o) => o.long === '--output');

      expect(outputOpt).toBeDefined();
    });
  });
});
