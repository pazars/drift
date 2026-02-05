import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm, readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createCli } from '../cli';
import { deserializeIndex } from '../writers/metadata';
import type { ProcessingManifest } from '../manifest';

const SAMPLE_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="StravaGPX" version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <time>2026-02-04T14:00:00Z</time>
  </metadata>
  <trk>
    <name>Test Run</name>
    <type>running</type>
    <trkseg>
      <trkpt lat="56.9675700" lon="24.1962330">
        <ele>11.3</ele>
        <time>2026-02-04T14:00:00Z</time>
      </trkpt>
      <trkpt lat="56.9676700" lon="24.1963330">
        <ele>12.0</ele>
        <time>2026-02-04T14:00:30Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

describe('CLI Integration: sync command', () => {
  let testDir: string;
  let inputDir: string;
  let outputDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `cli-integration-${Date.now()}`);
    inputDir = join(testDir, 'input');
    outputDir = join(testDir, 'output');
    await mkdir(inputDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('processes GPX files and creates output structure', async () => {
    await writeFile(join(inputDir, 'activity.gpx'), SAMPLE_GPX);

    const cli = createCli({ name: 'drift', version: '1.0.0' });
    await cli.parseAsync(['node', 'drift', 'sync', '-i', inputDir, '-o', outputDir]);

    // Check output structure
    const flatgeobufFiles = await readdir(join(outputDir, 'flatgeobuf'));
    const polylineFiles = await readdir(join(outputDir, 'polyline'));

    expect(flatgeobufFiles.length).toBe(1);
    expect(flatgeobufFiles[0]).toMatch(/^[a-f0-9]{12}\.fgb$/);
    expect(polylineFiles.length).toBe(1);
    expect(polylineFiles[0]).toMatch(/^[a-f0-9]{12}\.json$/);
  });

  it('creates index.json with activity metadata', async () => {
    await writeFile(join(inputDir, 'activity.gpx'), SAMPLE_GPX);

    const cli = createCli({ name: 'drift', version: '1.0.0' });
    await cli.parseAsync(['node', 'drift', 'sync', '-i', inputDir, '-o', outputDir]);

    const indexContent = await readFile(join(outputDir, 'index.json'), 'utf-8');
    const index = deserializeIndex(indexContent);

    expect(index.activities).toHaveLength(1);
    expect(index.activities[0]?.name).toBe('Test Run');
    expect(index.activities[0]?.sport).toBe('running');
  });

  it('creates manifest file', async () => {
    await writeFile(join(inputDir, 'activity.gpx'), SAMPLE_GPX);

    const cli = createCli({ name: 'drift', version: '1.0.0' });
    await cli.parseAsync(['node', 'drift', 'sync', '-i', inputDir, '-o', outputDir]);

    const manifestContent = await readFile(join(outputDir, '.manifest.json'), 'utf-8');
    const manifest = JSON.parse(manifestContent) as ProcessingManifest;

    expect(manifest.files).toBeDefined();
    expect(Object.keys(manifest.files).length).toBe(1);
  });

  it('skips unchanged files on second run', async () => {
    await writeFile(join(inputDir, 'activity.gpx'), SAMPLE_GPX);

    const cli = createCli({ name: 'drift', version: '1.0.0' });

    // First run
    await cli.parseAsync(['node', 'drift', 'sync', '-i', inputDir, '-o', outputDir]);

    // Get mtime of output file
    const flatgeobufFiles = await readdir(join(outputDir, 'flatgeobuf'));
    const fgbPath = join(outputDir, 'flatgeobuf', flatgeobufFiles[0]!);
    const stat1 = await stat(fgbPath);

    // Wait a bit
    await new Promise((r) => setTimeout(r, 50));

    // Second run
    const cli2 = createCli({ name: 'drift', version: '1.0.0' });
    await cli2.parseAsync(['node', 'drift', 'sync', '-i', inputDir, '-o', outputDir]);

    // Check file wasn't modified
    const stat2 = await stat(fgbPath);
    expect(stat2.mtimeMs).toBe(stat1.mtimeMs);
  });

  it('reprocesses all files with --force', async () => {
    await writeFile(join(inputDir, 'activity.gpx'), SAMPLE_GPX);

    const cli = createCli({ name: 'drift', version: '1.0.0' });
    await cli.parseAsync(['node', 'drift', 'sync', '-i', inputDir, '-o', outputDir]);

    // Get mtime
    const flatgeobufFiles = await readdir(join(outputDir, 'flatgeobuf'));
    const fgbPath = join(outputDir, 'flatgeobuf', flatgeobufFiles[0]!);
    const stat1 = await stat(fgbPath);

    // Wait
    await new Promise((r) => setTimeout(r, 50));

    // Run with --force
    const cli2 = createCli({ name: 'drift', version: '1.0.0' });
    await cli2.parseAsync(['node', 'drift', 'sync', '-i', inputDir, '-o', outputDir, '--force']);

    // Check file was modified
    const stat2 = await stat(fgbPath);
    expect(stat2.mtimeMs).toBeGreaterThan(stat1.mtimeMs);
  });

  it('processes multiple files', async () => {
    await writeFile(join(inputDir, 'activity1.gpx'), SAMPLE_GPX);
    await writeFile(join(inputDir, 'activity2.gpx'), SAMPLE_GPX.replace('Test Run', 'Second Run'));

    const cli = createCli({ name: 'drift', version: '1.0.0' });
    await cli.parseAsync(['node', 'drift', 'sync', '-i', inputDir, '-o', outputDir]);

    const indexContent = await readFile(join(outputDir, 'index.json'), 'utf-8');
    const index = deserializeIndex(indexContent);

    expect(index.activities).toHaveLength(2);
  });
});
