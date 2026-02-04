import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useReducedMotion } from './useReducedMotion';

describe('useReducedMotion', () => {
  let listeners: Map<string, (e: MediaQueryListEvent) => void>;
  let originalMatchMedia: typeof window.matchMedia;

  const createMatchMediaMock = (matches: boolean) => {
    return vi.fn(
      (query: string): MediaQueryList => ({
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn((event: string, handler: EventListener) => {
          listeners.set(event, handler as (e: MediaQueryListEvent) => void);
        }),
        removeEventListener: vi.fn((event: string) => {
          listeners.delete(event);
        }),
        dispatchEvent: vi.fn(() => true),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })
    );
  };

  beforeEach(() => {
    listeners = new Map();
    originalMatchMedia = window.matchMedia;
    window.matchMedia = createMatchMediaMock(false);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('returns false when no preference is set', () => {
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
  });

  it('returns true when prefers-reduced-motion is set', () => {
    window.matchMedia = createMatchMediaMock(true);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);
  });

  it('queries the correct media query', () => {
    const mockFn = createMatchMediaMock(false);
    window.matchMedia = mockFn;

    renderHook(() => useReducedMotion());

    expect(mockFn).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('updates when preference changes', () => {
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    // Simulate media query change
    act(() => {
      const handler = listeners.get('change');
      if (handler) {
        handler({ matches: true } as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(true);
  });

  it('cleans up event listener on unmount', () => {
    const removeEventListenerMock = vi.fn();
    window.matchMedia = vi.fn(
      (): MediaQueryList => ({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: removeEventListenerMock,
        dispatchEvent: vi.fn(() => true),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })
    );

    const { unmount } = renderHook(() => useReducedMotion());
    unmount();

    expect(removeEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
