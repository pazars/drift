import { describe, it, expect } from 'vitest';
import { DriftError, GPXParseError, EmptyTrackError, InvalidCoordinatesError } from '../errors';

describe('Error Types', () => {
  describe('DriftError', () => {
    it('is a base error class', () => {
      const error = new DriftError('test message');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DriftError);
      expect(error.message).toBe('test message');
      expect(error.name).toBe('DriftError');
    });
  });

  describe('GPXParseError', () => {
    it('extends DriftError', () => {
      const error = new GPXParseError('Invalid XML structure');
      expect(error).toBeInstanceOf(DriftError);
      expect(error).toBeInstanceOf(GPXParseError);
      expect(error.name).toBe('GPXParseError');
    });

    it('includes file path when provided', () => {
      const error = new GPXParseError('Invalid XML', {
        filePath: '/path/to/file.gpx',
      });
      expect(error.filePath).toBe('/path/to/file.gpx');
      expect(error.message).toContain('/path/to/file.gpx');
    });

    it('includes line number when provided', () => {
      const error = new GPXParseError('Unexpected token', {
        lineNumber: 42,
      });
      expect(error.lineNumber).toBe(42);
      expect(error.message).toContain('line 42');
    });

    it('includes both file path and line number', () => {
      const error = new GPXParseError('Parse failed', {
        filePath: '/test.gpx',
        lineNumber: 10,
      });
      expect(error.message).toContain('/test.gpx');
      expect(error.message).toContain('line 10');
    });
  });

  describe('EmptyTrackError', () => {
    it('extends DriftError', () => {
      const error = new EmptyTrackError();
      expect(error).toBeInstanceOf(DriftError);
      expect(error).toBeInstanceOf(EmptyTrackError);
      expect(error.name).toBe('EmptyTrackError');
    });

    it('has default message', () => {
      const error = new EmptyTrackError();
      expect(error.message).toContain('no track points');
    });

    it('accepts custom message', () => {
      const error = new EmptyTrackError('Track segment 2 is empty');
      expect(error.message).toBe('Track segment 2 is empty');
    });

    it('includes file path when provided', () => {
      const error = new EmptyTrackError(undefined, {
        filePath: '/empty.gpx',
      });
      expect(error.filePath).toBe('/empty.gpx');
    });
  });

  describe('InvalidCoordinatesError', () => {
    it('extends DriftError', () => {
      const error = new InvalidCoordinatesError(91, 0);
      expect(error).toBeInstanceOf(DriftError);
      expect(error).toBeInstanceOf(InvalidCoordinatesError);
      expect(error.name).toBe('InvalidCoordinatesError');
    });

    it('includes invalid coordinate values', () => {
      const error = new InvalidCoordinatesError(91, 200);
      expect(error.lat).toBe(91);
      expect(error.lon).toBe(200);
      expect(error.message).toContain('91');
      expect(error.message).toContain('200');
    });

    it('validates latitude out of range', () => {
      const error = new InvalidCoordinatesError(-91, 0);
      expect(error.message).toContain('latitude');
    });

    it('validates longitude out of range', () => {
      const error = new InvalidCoordinatesError(0, 181);
      expect(error.message).toContain('longitude');
    });

    it('includes point index when provided', () => {
      const error = new InvalidCoordinatesError(91, 0, { pointIndex: 5 });
      expect(error.pointIndex).toBe(5);
      expect(error.message).toContain('point 5');
    });
  });

  describe('Error catching', () => {
    it('can catch DriftError for all custom errors', () => {
      const errors = [
        new GPXParseError('test'),
        new EmptyTrackError(),
        new InvalidCoordinatesError(91, 0),
      ];

      for (const error of errors) {
        try {
          throw error;
        } catch (e) {
          expect(e).toBeInstanceOf(DriftError);
        }
      }
    });

    it('can catch specific error types', () => {
      const error = new GPXParseError('test');

      try {
        throw error;
      } catch (e) {
        if (e instanceof GPXParseError) {
          expect(e.name).toBe('GPXParseError');
        } else {
          throw new Error('Should have caught GPXParseError');
        }
      }
    });
  });
});
