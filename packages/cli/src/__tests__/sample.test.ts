import { describe, it, expect } from 'vitest';
import { VERSION } from '../index';

describe('Sample Test', () => {
  it('should pass a basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should export VERSION', () => {
    expect(VERSION).toBe('0.0.1');
  });
});
