import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { processGpxFile } from '../processor';

interface PolylineFileData {
  id: string;
  polyline: string;
}

const SAMPLE_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="StravaGPX" version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <time>2026-02-04T14:00:00Z</time>
  </metadata>
  <trk>
    <name>Morning Run</name>
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
      <trkpt lat="56.9677700" lon="24.1964330">
        <ele>12.5</ele>
        <time>2026-02-04T14:01:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

describe('processGpxFile', () => {
  let testDir: string;
  let outputDir: string;
  let inputFile: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `processor-test-${Date.now()}`);
    outputDir = join(testDir, 'output');
    inputFile = join(testDir, 'morning-run.gpx');
    await mkdir(testDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });
    await writeFile(inputFile, SAMPLE_GPX);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('returns ProcessedActivity with metadata', async () => {
    const result = await processGpxFile({
      inputPath: inputFile,
      outputDir,
    });

    expect(result.metadata).toBeDefined();
    expect(result.metadata.name).toBe('Morning Run');
    expect(result.metadata.sport).toBe('running');
    expect(result.metadata.sourceFile).toBe(inputFile);
  });

  it('generates deterministic ID from file path', async () => {
    const result = await processGpxFile({
      inputPath: inputFile,
      outputDir,
    });

    expect(result.metadata.id).toMatch(/^[a-f0-9]{12}$/);

    // Process same file again - should get same ID
    const result2 = await processGpxFile({
      inputPath: inputFile,
      outputDir,
    });

    expect(result2.metadata.id).toBe(result.metadata.id);
  });

  it('calculates distance and duration', async () => {
    const result = await processGpxFile({
      inputPath: inputFile,
      outputDir,
    });

    expect(result.metadata.distance).toBeGreaterThan(0);
    expect(result.metadata.duration).toBe(60); // 1 minute
  });

  it('creates flatgeobuf subdirectory and writes .fgb file', async () => {
    const result = await processGpxFile({
      inputPath: inputFile,
      outputDir,
    });

    const fgbPath = join(outputDir, 'flatgeobuf', `${result.metadata.id}.fgb`);
    const fgbContent = await readFile(fgbPath);

    expect(fgbContent.length).toBeGreaterThan(0);
    expect(result.metadata.geometryFile).toBe(`flatgeobuf/${result.metadata.id}.fgb`);
  });

  it('creates polyline subdirectory and writes .json file', async () => {
    const result = await processGpxFile({
      inputPath: inputFile,
      outputDir,
    });

    const polylinePath = join(outputDir, 'polyline', `${result.metadata.id}.json`);
    const polylineContent = await readFile(polylinePath, 'utf-8');
    const polylineData = JSON.parse(polylineContent) as PolylineFileData;

    expect(polylineData.id).toBe(result.metadata.id);
    expect(polylineData.polyline).toBeDefined();
    expect(typeof polylineData.polyline).toBe('string');
    expect(result.metadata.overviewPolyline).toBe(polylineData.polyline);
  });

  it('returns warnings for missing data', async () => {
    const noElevationGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>No Elevation</name>
    <trkseg>
      <trkpt lat="56.9675700" lon="24.1962330">
        <time>2026-02-04T14:00:00Z</time>
      </trkpt>
      <trkpt lat="56.9676700" lon="24.1963330">
        <time>2026-02-04T14:00:30Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

    const noElevFile = join(testDir, 'no-elevation.gpx');
    await writeFile(noElevFile, noElevationGpx);

    const result = await processGpxFile({
      inputPath: noElevFile,
      outputDir,
    });

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes('elevation'))).toBe(true);
  });
});
