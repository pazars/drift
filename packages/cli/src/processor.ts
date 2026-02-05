/**
 * Core GPX file processor.
 * @module processor
 */

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseGPX } from './parsers/index.js';
import { calculateMetadata } from './parsers/metadata.js';
import { simplify3D } from './transforms/index.js';
import { writeFlatGeobuf } from './writers/flatgeobuf.js';
import { encodeFlexiblePolyline } from './writers/polyline.js';
import { generateActivityId } from './utils/index.js';
import type { ActivityMetadata, SportType } from './types.js';

/** Default simplification tolerance in degrees (~11m) */
const DEFAULT_SIMPLIFY_TOLERANCE = 0.0001;

/**
 * Options for processing a GPX file.
 */
export interface ProcessorOptions {
  /** Absolute path to the GPX file */
  inputPath: string;
  /** Output base directory */
  outputDir: string;
  /** Simplification tolerance in degrees (default: 0.0001) */
  simplifyTolerance?: number;
}

/**
 * Result of processing a GPX file.
 */
export interface ProcessedActivity {
  /** Complete activity metadata */
  metadata: ActivityMetadata;
  /** Any warnings generated during processing */
  warnings: string[];
}

/**
 * Polyline JSON file structure.
 */
interface PolylineFile {
  id: string;
  polyline: string;
}

/**
 * Map GPX type string to SportType.
 */
function mapSportType(gpxType?: string): SportType {
  if (!gpxType) return 'other';

  const normalized = gpxType.toLowerCase();

  const mapping: Record<string, SportType> = {
    running: 'running',
    run: 'running',
    cycling: 'cycling',
    biking: 'cycling',
    ride: 'cycling',
    hiking: 'hiking',
    hike: 'hiking',
    walking: 'walking',
    walk: 'walking',
    skiing: 'skiing',
    ski: 'skiing',
    swimming: 'swimming',
    swim: 'swimming',
  };

  return mapping[normalized] ?? 'other';
}

/**
 * Process a GPX file and write outputs.
 *
 * Pipeline:
 * 1. Read and parse GPX file
 * 2. Calculate metadata (distance, duration, elevation)
 * 3. Simplify track for overview polyline
 * 4. Write FlatGeobuf geometry file
 * 5. Write polyline JSON file
 * 6. Return activity metadata
 *
 * @param options - Processing options
 * @returns Processed activity with metadata and warnings
 */
export async function processGpxFile(options: ProcessorOptions): Promise<ProcessedActivity> {
  const { inputPath, outputDir, simplifyTolerance = DEFAULT_SIMPLIFY_TOLERANCE } = options;

  // 1. Read and parse
  const content = await readFile(inputPath, 'utf-8');
  const { track, warnings } = parseGPX(content);

  // 2. Calculate metadata
  const calculated = calculateMetadata(track);

  // 3. Generate ID
  const id = generateActivityId(inputPath);

  // 4. Get all points for simplification
  const allPoints = track.segments.flatMap((seg) => seg.points);
  const simplifiedPoints = simplify3D(allPoints, simplifyTolerance);

  // 5. Encode polyline from simplified points
  const polyline = encodeFlexiblePolyline(simplifiedPoints);

  // 6. Extract start date from first point with time
  const firstPointWithTime = allPoints.find((p) => p.time);
  const date = firstPointWithTime?.time ?? new Date();

  // 7. Build activity metadata
  const metadata: ActivityMetadata = {
    id,
    sourceFile: inputPath,
    name: track.name,
    sport: mapSportType(track.type),
    date,
    distance: calculated.distance,
    duration: calculated.duration,
    movingTime: calculated.movingTime,
    elevation: calculated.elevation,
    bounds: calculated.bounds,
    segments: calculated.segments,
    pointCount: {
      original: calculated.pointCount.original,
      simplified: simplifiedPoints.length,
    },
    overviewPolyline: polyline,
    geometryFile: `flatgeobuf/${id}.fgb`,
  };

  // 8. Ensure output directories exist
  const flatgeobufDir = join(outputDir, 'flatgeobuf');
  const polylineDir = join(outputDir, 'polyline');
  await mkdir(flatgeobufDir, { recursive: true });
  await mkdir(polylineDir, { recursive: true });

  // 9. Write FlatGeobuf
  const fgbData = writeFlatGeobuf(track.segments, metadata);
  await writeFile(join(flatgeobufDir, `${id}.fgb`), fgbData);

  // 10. Write polyline JSON
  const polylineFile: PolylineFile = { id, polyline };
  await writeFile(join(polylineDir, `${id}.json`), JSON.stringify(polylineFile, null, 2));

  return { metadata, warnings };
}
