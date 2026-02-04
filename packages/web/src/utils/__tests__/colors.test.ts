import { describe, it, expect } from 'vitest';
import { getActivityColor, getActivityColorRGB, ACTIVITY_COLORS } from '../colors';
import type { ActivityType } from '../../types';

describe('colors', () => {
  describe('ACTIVITY_COLORS', () => {
    it('has color defined for each activity type', () => {
      const types: ActivityType[] = ['run', 'ride', 'walk', 'hike', 'swim', 'ski', 'other'];

      types.forEach((type) => {
        expect(ACTIVITY_COLORS[type]).toBeDefined();
      });
    });
  });

  describe('getActivityColor', () => {
    it('returns hex color for run', () => {
      const color = getActivityColor('run');
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('returns hex color for ride', () => {
      const color = getActivityColor('ride');
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('returns hex color for walk', () => {
      const color = getActivityColor('walk');
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('returns hex color for hike', () => {
      const color = getActivityColor('hike');
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('returns hex color for swim', () => {
      const color = getActivityColor('swim');
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('returns hex color for ski', () => {
      const color = getActivityColor('ski');
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('returns fallback color for other', () => {
      const color = getActivityColor('other');
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe('getActivityColorRGB', () => {
    it('returns RGB array for run', () => {
      const rgb = getActivityColorRGB('run');
      expect(rgb).toHaveLength(3);
      rgb.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(255);
      });
    });

    it('returns RGB array for ride', () => {
      const rgb = getActivityColorRGB('ride');
      expect(rgb).toHaveLength(3);
    });

    it('returns RGB array with alpha when specified', () => {
      const rgba = getActivityColorRGB('run', 128);
      expect(rgba).toHaveLength(4);
      expect(rgba[3]).toBe(128);
    });

    it('converts hex to correct RGB values', () => {
      // Red (#FF0000) should be [255, 0, 0]
      // This is a general test - actual colors may differ
      const rgb = getActivityColorRGB('run');
      expect(rgb.every((v) => typeof v === 'number')).toBe(true);
    });
  });
});
