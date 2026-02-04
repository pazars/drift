import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useActivities } from './useActivities';
import type { Activity } from '../types';

const mockActivities: Activity[] = [
  {
    id: 'activity-1',
    name: 'Morning Run',
    type: 'run',
    date: '2024-01-15T08:00:00Z',
    distance: 5000,
    duration: 1800,
    polyline: 'encoded_polyline',
  },
  {
    id: 'activity-2',
    name: 'Evening Ride',
    type: 'ride',
    date: '2024-01-16T18:00:00Z',
    distance: 25000,
    duration: 3600,
    polyline: 'encoded_polyline_2',
  },
];

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useActivities', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with loading state', () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ activities: [] }),
    });

    const { result } = renderHook(() => useActivities('/api/activities.json'));

    expect(result.current.isLoading).toBe(true);
  });

  it('loads activities from URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ activities: mockActivities }),
    });

    const { result } = renderHook(() => useActivities('/api/activities.json'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.activities).toEqual(mockActivities);
    expect(mockFetch).toHaveBeenCalledWith('/api/activities.json');
  });

  it('handles fetch error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const { result } = renderHook(() => useActivities('/api/activities.json'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.activities).toEqual([]);
  });

  it('handles network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useActivities('/api/activities.json'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
  });

  it('does not fetch when url is undefined', () => {
    const { result } = renderHook(() => useActivities(undefined));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.activities).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('provides refetch function', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ activities: [mockActivities[0]] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ activities: mockActivities }),
      });

    const { result } = renderHook(() => useActivities('/api/activities.json'));

    await waitFor(() => {
      expect(result.current.activities).toHaveLength(1);
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.activities).toHaveLength(2);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
