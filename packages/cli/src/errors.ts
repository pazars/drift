/**
 * Custom error types for Drift CLI.
 * @module errors
 */

/**
 * Base error class for all Drift errors.
 * Allows catching all custom errors with a single type.
 */
export class DriftError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DriftError';
    // Maintains proper stack trace for where error was thrown (V8 only)
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Options for GPX parse errors.
 */
export interface GPXParseErrorOptions {
  /** Path to the GPX file that failed to parse */
  filePath?: string;
  /** Line number where the error occurred */
  lineNumber?: number;
}

/**
 * Error thrown when GPX file parsing fails.
 * Includes optional file path and line number for debugging.
 */
export class GPXParseError extends DriftError {
  readonly filePath?: string;
  readonly lineNumber?: number;

  constructor(message: string, options?: GPXParseErrorOptions) {
    const parts: string[] = [message];

    if (options?.filePath) {
      parts.push(`in ${options.filePath}`);
    }

    if (options?.lineNumber) {
      parts.push(`at line ${options.lineNumber}`);
    }

    super(parts.join(' '));
    this.name = 'GPXParseError';
    if (options?.filePath !== undefined) {
      this.filePath = options.filePath;
    }
    if (options?.lineNumber !== undefined) {
      this.lineNumber = options.lineNumber;
    }
  }
}

/**
 * Options for empty track errors.
 */
export interface EmptyTrackErrorOptions {
  /** Path to the GPX file */
  filePath?: string;
}

/**
 * Error thrown when a GPX track contains no points.
 */
export class EmptyTrackError extends DriftError {
  readonly filePath?: string;

  constructor(message?: string, options?: EmptyTrackErrorOptions) {
    super(message ?? 'Track contains no track points');
    this.name = 'EmptyTrackError';
    if (options?.filePath !== undefined) {
      this.filePath = options.filePath;
    }
  }
}

/**
 * Options for invalid coordinates errors.
 */
export interface InvalidCoordinatesErrorOptions {
  /** Index of the point with invalid coordinates */
  pointIndex?: number;
  /** Path to the GPX file */
  filePath?: string;
}

/**
 * Error thrown when coordinates are out of valid range.
 * Valid ranges: latitude [-90, 90], longitude [-180, 180]
 */
export class InvalidCoordinatesError extends DriftError {
  readonly lat: number;
  readonly lon: number;
  readonly pointIndex?: number;
  readonly filePath?: string;

  constructor(lat: number, lon: number, options?: InvalidCoordinatesErrorOptions) {
    const issues: string[] = [];

    if (lat < -90 || lat > 90) {
      issues.push(`latitude ${lat} out of range [-90, 90]`);
    }

    if (lon < -180 || lon > 180) {
      issues.push(`longitude ${lon} out of range [-180, 180]`);
    }

    let message = `Invalid coordinates: ${issues.join(', ')}`;

    if (options?.pointIndex !== undefined) {
      message = `Invalid coordinates at point ${options.pointIndex}: ${issues.join(', ')}`;
    }

    super(message);
    this.name = 'InvalidCoordinatesError';
    this.lat = lat;
    this.lon = lon;
    if (options?.pointIndex !== undefined) {
      this.pointIndex = options.pointIndex;
    }
    if (options?.filePath !== undefined) {
      this.filePath = options.filePath;
    }
  }
}
