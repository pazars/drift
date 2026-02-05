/**
 * FlatGeobuf writer for track geometry data.
 * @module writers/flatgeobuf
 */

import * as flatgeobuf from 'flatgeobuf';
import type {
  Feature,
  FeatureCollection,
  LineString,
  MultiLineString,
  Position,
  GeoJsonProperties,
} from 'geojson';
import type { TrackSegment, ActivityMetadata } from '../types.js';

/**
 * Convert track segments to GeoJSON geometry.
 * Uses LineString for single segment, MultiLineString for multiple.
 *
 * @param segments - Array of track segments
 * @returns GeoJSON geometry (LineString or MultiLineString)
 */
function segmentsToGeometry(segments: TrackSegment[]): LineString | MultiLineString | null {
  // Filter out empty segments
  const nonEmptySegments = segments.filter((seg) => seg.points.length > 0);

  if (nonEmptySegments.length === 0) {
    return null;
  }

  // Convert points to GeoJSON coordinates [lon, lat, ele]
  const segmentCoords: Position[][] = nonEmptySegments.map((seg) =>
    seg.points.map((p): Position => [p.lon, p.lat, p.ele])
  );

  if (segmentCoords.length === 1) {
    // Single segment: use LineString
    return {
      type: 'LineString',
      coordinates: segmentCoords[0]!,
    };
  }

  // Multiple segments: use MultiLineString
  return {
    type: 'MultiLineString',
    coordinates: segmentCoords,
  };
}

/**
 * Convert activity metadata to GeoJSON properties.
 *
 * @param metadata - Activity metadata
 * @returns GeoJSON properties object
 */
function metadataToProperties(metadata: ActivityMetadata): GeoJsonProperties {
  return {
    id: metadata.id,
    sourceFile: metadata.sourceFile,
    name: metadata.name,
    sport: metadata.sport,
    date: metadata.date.toISOString(),
    distance: metadata.distance,
    duration: metadata.duration,
    movingTime: metadata.movingTime,
    elevationGain: metadata.elevation.gain,
    elevationLoss: metadata.elevation.loss,
    elevationMax: metadata.elevation.max,
    elevationMin: metadata.elevation.min,
    boundsNorth: metadata.bounds.north,
    boundsSouth: metadata.bounds.south,
    boundsEast: metadata.bounds.east,
    boundsWest: metadata.bounds.west,
    segments: metadata.segments,
    pointCountOriginal: metadata.pointCount.original,
    pointCountSimplified: metadata.pointCount.simplified,
    ...(metadata.overviewPolyline && { overviewPolyline: metadata.overviewPolyline }),
    ...(metadata.geometryFile && { geometryFile: metadata.geometryFile }),
    ...(metadata.tags && { tags: metadata.tags.join(',') }),
  };
}

/**
 * Write track segments to FlatGeobuf format.
 *
 * @param segments - Array of track segments with 3D coordinates
 * @param metadata - Activity metadata to include as feature properties
 * @returns FlatGeobuf binary data as Uint8Array (empty array if no valid geometry)
 */
export function writeFlatGeobuf(segments: TrackSegment[], metadata: ActivityMetadata): Uint8Array {
  const geometry = segmentsToGeometry(segments);

  // Return empty array for empty/invalid geometry
  // FlatGeobuf cannot serialize an empty FeatureCollection
  if (!geometry) {
    return new Uint8Array(0);
  }

  // Create GeoJSON feature collection with the track feature
  const feature: Feature = {
    type: 'Feature',
    geometry,
    properties: metadataToProperties(metadata),
  };

  const featureCollection: FeatureCollection = {
    type: 'FeatureCollection',
    features: [feature],
  };

  // Serialize to FlatGeobuf
  // CRS code 4326 = WGS84 (standard GPS coordinates)
  return flatgeobuf.geojson.serialize(featureCollection, 4326);
}

/**
 * Read FlatGeobuf binary data back to GeoJSON features.
 * Primarily used for testing/validation.
 *
 * @param buffer - FlatGeobuf binary data
 * @returns Array of GeoJSON features
 */
export async function readFlatGeobuf(buffer: Uint8Array): Promise<Feature[]> {
  const features: Feature[] = [];

  // Use the deserialize generator
  for await (const feature of flatgeobuf.geojson.deserialize(buffer)) {
    features.push(feature as Feature);
  }

  return features;
}
