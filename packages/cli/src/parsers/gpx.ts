/**
 * GPX file parser using @tmcw/togeojson.
 * @module parsers/gpx
 */

import { gpx } from '@tmcw/togeojson';
import { XMLParser } from 'fast-xml-parser';
import { DOMParser } from 'linkedom';
import type {
  ParseResult,
  ParsedTrack,
  TrackSegment,
  TrackPoint,
  TrackPointExtensions,
} from '../types';

interface GPXTrackPoint {
  '@_lat': string;
  '@_lon': string;
  ele?: string | number;
  time?: string;
  extensions?: {
    'gpxtpx:TrackPointExtension'?: {
      'gpxtpx:hr'?: string | number;
      'gpxtpx:cad'?: string | number;
      'gpxtpx:atemp'?: string | number;
    };
    power?: string | number;
  };
}

interface GPXTrackSegment {
  trkpt: GPXTrackPoint | GPXTrackPoint[];
}

interface GPXTrack {
  name?: string;
  type?: string;
  trkseg: GPXTrackSegment | GPXTrackSegment[];
}

interface GPXDocument {
  gpx: {
    trk: GPXTrack | GPXTrack[];
  };
}

interface GPXFeatureProperties {
  coordinateProperties?: {
    times?: string[] | string[][];
  };
}

/**
 * Parse a GPX file content into a ParseResult structure.
 * @param content - Raw GPX XML content as string
 * @returns ParseResult with track data and any warnings
 * @throws Error if XML is malformed or track contains no points
 */
export function parseGPX(content: string): ParseResult {
  const warnings: string[] = [];

  // Parse XML to extract raw GPX data for extensions
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: true,
  });

  let gpxDoc: GPXDocument;
  try {
    gpxDoc = parser.parse(content) as GPXDocument;
  } catch {
    throw new Error('Failed to parse GPX: Invalid XML');
  }

  if (!gpxDoc.gpx?.trk) {
    throw new Error('Failed to parse GPX: No track found');
  }

  // Parse using togeojson for coordinate extraction
  const domParser = new DOMParser();
  const doc = domParser.parseFromString(content, 'text/xml');

  // linkedom's querySelector returns unknown type, so we check for truthiness
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Failed to parse GPX: Invalid XML');
  }

  // Cast linkedom document to DOM Document for togeojson compatibility
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  const geoJson = gpx(doc as any);

  const firstFeature = geoJson.features[0];
  if (!geoJson.features || geoJson.features.length === 0 || !firstFeature?.geometry) {
    throw new Error('Failed to parse GPX: No track data found');
  }

  // Extract track metadata
  const tracks = Array.isArray(gpxDoc.gpx.trk) ? gpxDoc.gpx.trk : [gpxDoc.gpx.trk];
  const firstTrack = tracks[0];
  if (!firstTrack) {
    throw new Error('Failed to parse GPX: No track found');
  }
  const trackName = firstTrack.name ?? 'Unnamed Track';
  const trackType = firstTrack.type;

  // Build extension lookup map from raw GPX data
  const extensionMap = buildExtensionMap(firstTrack);

  // Process segments
  const segments: TrackSegment[] = [];
  let hasElevation = false;
  let hasTimestamps = false;
  let totalPoints = 0;

  for (const feature of geoJson.features) {
    const props = feature.properties as GPXFeatureProperties | null;
    if (feature.geometry?.type === 'LineString') {
      const segment = processLineString(
        feature.geometry.coordinates as number[][],
        props?.coordinateProperties?.times as string[] | undefined,
        extensionMap,
        totalPoints
      );
      if (segment.points.length > 0) {
        segments.push(segment);

        // Check for elevation and timestamps
        for (const point of segment.points) {
          if (point.ele !== 0) hasElevation = true;
          if (point.time) hasTimestamps = true;
        }
        totalPoints += segment.points.length;
      }
    } else if (feature.geometry?.type === 'MultiLineString') {
      let segmentOffset = totalPoints;
      for (const coords of feature.geometry.coordinates as number[][][]) {
        const times = props?.coordinateProperties?.times as string[][] | undefined;
        const segmentIndex = segments.length;
        const segment = processLineString(
          coords,
          times?.[segmentIndex],
          extensionMap,
          segmentOffset
        );
        if (segment.points.length > 0) {
          segments.push(segment);

          for (const point of segment.points) {
            if (point.ele !== 0) hasElevation = true;
            if (point.time) hasTimestamps = true;
          }
          segmentOffset += segment.points.length;
        }
      }
      totalPoints = segmentOffset;
    }
  }

  if (totalPoints === 0) {
    throw new Error('Failed to parse GPX: no track points found');
  }

  if (!hasElevation) {
    warnings.push('Missing elevation data in track points');
  }

  if (!hasTimestamps) {
    warnings.push('Missing timestamp data in track points');
  }

  const track: ParsedTrack = {
    name: trackName,
    segments,
    ...(trackType !== undefined && { type: trackType }),
  };

  return { track, warnings };
}

/**
 * Build a map of point index to extension data from raw GPX.
 */
function buildExtensionMap(track: GPXTrack): Map<number, TrackPointExtensions> {
  const map = new Map<number, TrackPointExtensions>();
  let index = 0;

  const segments = Array.isArray(track.trkseg) ? track.trkseg : [track.trkseg];

  for (const seg of segments) {
    if (!seg?.trkpt) continue;

    const points = Array.isArray(seg.trkpt) ? seg.trkpt : [seg.trkpt];

    for (const pt of points) {
      if (pt.extensions) {
        const ext: TrackPointExtensions = {};
        const tpExt = pt.extensions['gpxtpx:TrackPointExtension'];

        if (tpExt) {
          if (tpExt['gpxtpx:hr'] !== undefined) {
            ext.heartRate = Number(tpExt['gpxtpx:hr']);
          }
          if (tpExt['gpxtpx:cad'] !== undefined) {
            ext.cadence = Number(tpExt['gpxtpx:cad']);
          }
          if (tpExt['gpxtpx:atemp'] !== undefined) {
            ext.temperature = Number(tpExt['gpxtpx:atemp']);
          }
        }

        if (pt.extensions['power'] !== undefined) {
          ext.power = Number(pt.extensions['power']);
        }

        if (Object.keys(ext).length > 0) {
          map.set(index, ext);
        }
      }
      index++;
    }
  }

  return map;
}

/**
 * Process a LineString into a TrackSegment.
 */
function processLineString(
  coordinates: number[][],
  times: string[] | undefined,
  extensionMap: Map<number, TrackPointExtensions>,
  startIndex: number
): TrackSegment {
  const points: TrackPoint[] = [];

  for (let i = 0; i < coordinates.length; i++) {
    const coord = coordinates[i];
    if (!coord) continue;

    const point: TrackPoint = {
      lon: coord[0] ?? 0,
      lat: coord[1] ?? 0,
      ele: coord[2] ?? 0,
    };

    const timeValue = times?.[i];
    if (timeValue) {
      point.time = new Date(timeValue);
    }

    const ext = extensionMap.get(startIndex + i);
    if (ext) {
      point.extensions = ext;
    }

    points.push(point);
  }

  return { points };
}
