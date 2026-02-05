import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, readFile, readdir, cp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createCli } from '../cli';
import { deserializeIndex } from '../writers/metadata';

/** Polyline output format */
interface PolylineOutput {
  id: string;
  polyline: string;
}

describe('E2E: Real GPX Files', () => {
  let testDir: string;
  let inputDir: string;
  let outputDir: string;

  // Path to sample GPX files
  const gpxDataDir = join(__dirname, '../../gpx_data');

  beforeEach(async () => {
    testDir = join(tmpdir(), `e2e-test-${Date.now()}`);
    inputDir = join(testDir, 'input');
    outputDir = join(testDir, 'output');
    await mkdir(inputDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('processes Afternoon_Run.gpx successfully', async () => {
    // Copy sample file
    await cp(join(gpxDataDir, 'Afternoon_Run.gpx'), join(inputDir, 'Afternoon_Run.gpx'));

    const cli = createCli({ name: 'drift', version: '1.0.0' });
    await cli.parseAsync(['node', 'drift', 'sync', '-i', inputDir, '-o', outputDir]);

    // Verify outputs exist
    const flatgeobufFiles = await readdir(join(outputDir, 'flatgeobuf'));
    const polylineFiles = await readdir(join(outputDir, 'polyline'));
    expect(flatgeobufFiles.length).toBe(1);
    expect(polylineFiles.length).toBe(1);

    // Verify index
    const indexContent = await readFile(join(outputDir, 'index.json'), 'utf-8');
    const index = deserializeIndex(indexContent);
    expect(index.activities.length).toBe(1);
    expect(index.activities[0]?.name).toBe('Afternoon Run');
    expect(index.activities[0]?.sport).toBe('running');
    expect(index.activities[0]?.distance).toBeGreaterThan(0);
    expect(index.activities[0]?.duration).toBeGreaterThan(0);
  });

  it('processes all three GPX files', async () => {
    // Copy all sample files
    await cp(join(gpxDataDir, 'Morning_Run.gpx'), join(inputDir, 'Morning_Run.gpx'));
    await cp(join(gpxDataDir, 'Afternoon_Run.gpx'), join(inputDir, 'Afternoon_Run.gpx'));
    await cp(join(gpxDataDir, 'Afternoon_Run2.gpx'), join(inputDir, 'Afternoon_Run2.gpx'));

    const cli = createCli({ name: 'drift', version: '1.0.0' });
    await cli.parseAsync(['node', 'drift', 'sync', '-i', inputDir, '-o', outputDir]);

    // Verify outputs
    const flatgeobufFiles = await readdir(join(outputDir, 'flatgeobuf'));
    const polylineFiles = await readdir(join(outputDir, 'polyline'));
    expect(flatgeobufFiles.length).toBe(3);
    expect(polylineFiles.length).toBe(3);

    // Verify index
    const indexContent = await readFile(join(outputDir, 'index.json'), 'utf-8');
    const index = deserializeIndex(indexContent);
    expect(index.activities.length).toBe(3);

    // Verify sorted by date (newest first)
    const dates = index.activities.map((a) => a.date.getTime());
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  it('generates valid polyline data', async () => {
    await cp(join(gpxDataDir, 'Morning_Run.gpx'), join(inputDir, 'Morning_Run.gpx'));

    const cli = createCli({ name: 'drift', version: '1.0.0' });
    await cli.parseAsync(['node', 'drift', 'sync', '-i', inputDir, '-o', outputDir]);

    const polylineFiles = await readdir(join(outputDir, 'polyline'));
    const polylineContent = await readFile(join(outputDir, 'polyline', polylineFiles[0]!), 'utf-8');
    const polylineData = JSON.parse(polylineContent) as PolylineOutput;

    expect(polylineData.id).toMatch(/^[a-f0-9]{12}$/);
    expect(polylineData.polyline).toBeDefined();
    expect(polylineData.polyline.length).toBeGreaterThan(10);
  });

  it('simplifies tracks (fewer points than original)', async () => {
    await cp(join(gpxDataDir, 'Morning_Run.gpx'), join(inputDir, 'Morning_Run.gpx'));

    const cli = createCli({ name: 'drift', version: '1.0.0' });
    await cli.parseAsync(['node', 'drift', 'sync', '-i', inputDir, '-o', outputDir]);

    const indexContent = await readFile(join(outputDir, 'index.json'), 'utf-8');
    const index = deserializeIndex(indexContent);
    const activity = index.activities[0];

    expect(activity?.pointCount.simplified).toBeLessThan(activity?.pointCount.original ?? 0);
    expect(activity?.pointCount.simplified).toBeGreaterThan(10); // Still has meaningful data
  });
});
