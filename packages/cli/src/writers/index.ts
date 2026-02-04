/**
 * Output writers for track data.
 * @module writers
 */

export { writeFlatGeobuf, readFlatGeobuf } from './flatgeobuf';
export { createMetadataIndex, addToIndex, serializeIndex, deserializeIndex } from './metadata';
export type { MetadataIndex } from './metadata';
