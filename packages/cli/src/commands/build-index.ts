/**
 * Index builder from processed FlatGeobuf files.
 * @module commands/build-index
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { readFlatGeobuf } from '../writers/flatgeobuf';
import { createMetadataIndex, serializeIndex } from '../writers/metadata';
import { loadTagStore, getFileTags } from './tag';
import type { ActivityMetadata, SportType } from '../types';

/**
 * Build index.json from existing FlatGeobuf files.
 *
 * Scans the flatgeobuf/ subdirectory, reads metadata from each file,
 * merges tags from tags.json, and writes a sorted index.json.
 *
 * @param outputDir - Output directory containing flatgeobuf/ subdirectory
 */
export async function buildIndex(outputDir: string): Promise<void> {
  const flatgeobufDir = join(outputDir, 'flatgeobuf');
  const tagsFile = join(outputDir, 'tags.json');
  const indexFile = join(outputDir, 'index.json');

  // Load tags
  const tagStore = await loadTagStore(tagsFile);

  // Scan for .fgb files
  let files: string[] = [];
  try {
    const entries = await readdir(flatgeobufDir);
    files = entries.filter((f) => f.endsWith('.fgb'));
  } catch {
    // Directory doesn't exist or is empty
    files = [];
  }

  // Read metadata from each FlatGeobuf file
  const activities: ActivityMetadata[] = [];

  for (const file of files) {
    const filePath = join(flatgeobufDir, file);
    const buffer = await readFile(filePath);
    const features = await readFlatGeobuf(new Uint8Array(buffer));

    if (features.length === 0) continue;

    const props = features[0]?.properties;
    if (!props) continue;

    // Reconstruct ActivityMetadata from FlatGeobuf properties
    const metadata: ActivityMetadata = {
      id: props.id as string,
      sourceFile: props.sourceFile as string,
      name: props.name as string,
      sport: props.sport as SportType,
      date: new Date(props.date as string),
      distance: props.distance as number,
      duration: props.duration as number,
      movingTime: props.movingTime as number,
      elevation: {
        gain: props.elevationGain as number,
        loss: props.elevationLoss as number,
        max: props.elevationMax as number,
        min: props.elevationMin as number,
      },
      bounds: {
        north: props.boundsNorth as number,
        south: props.boundsSouth as number,
        east: props.boundsEast as number,
        west: props.boundsWest as number,
      },
      segments: props.segments as number,
      pointCount: {
        original: props.pointCountOriginal as number,
        simplified: props.pointCountSimplified as number,
      },
    };

    // Add optional fields
    if (props.overviewPolyline) {
      metadata.overviewPolyline = props.overviewPolyline as string;
    }
    if (props.geometryFile) {
      metadata.geometryFile = props.geometryFile as string;
    }

    // Merge tags from tag store
    const fileTags = getFileTags(tagStore, metadata.sourceFile);
    if (fileTags.length > 0) {
      metadata.tags = fileTags;
    }

    activities.push(metadata);
  }

  // Create and write index
  const index = createMetadataIndex(activities);
  await writeFile(indexFile, serializeIndex(index));
}
