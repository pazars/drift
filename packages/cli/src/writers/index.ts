/**
 * Output writers for track data.
 * @module writers
 */

export { writeFlatGeobuf, readFlatGeobuf } from './flatgeobuf.js';
export { encodeFlexiblePolyline, decodeFlexiblePolyline } from './polyline.js';
export type { PolylineEncodingOptions } from './polyline.js';
export { createMetadataIndex, addToIndex, serializeIndex, deserializeIndex } from './metadata.js';
export type { MetadataIndex } from './metadata.js';
