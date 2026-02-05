import { describe, it, expect } from 'vitest';
import { groupActivitiesByMonth } from './groupActivities';
import type { Activity } from '../types';

const createActivity = (id: string, date: string, name: string = 'Test'): Activity => ({
  id,
  name,
  type: 'run',
  date,
  distance: 5000,
  duration: 1800,
  polyline: 'encoded',
});

describe('groupActivitiesByMonth', () => {
  it('returns empty array for empty input', () => {
    expect(groupActivitiesByMonth([])).toEqual([]);
  });

  it('groups single activity into one month', () => {
    const activities = [createActivity('1', '2024-03-15T08:00:00Z')];
    const result = groupActivitiesByMonth(activities);

    expect(result).toHaveLength(1);
    expect(result[0]?.key).toBe('2024-03');
    expect(result[0]?.label).toBe('March 2024');
    expect(result[0]?.activities).toHaveLength(1);
  });

  it('groups multiple activities in same month', () => {
    const activities = [
      createActivity('1', '2024-03-15T08:00:00Z'),
      createActivity('2', '2024-03-20T08:00:00Z'),
      createActivity('3', '2024-03-01T08:00:00Z'),
    ];
    const result = groupActivitiesByMonth(activities);

    expect(result).toHaveLength(1);
    expect(result[0]?.activities).toHaveLength(3);
  });

  it('creates separate groups for different months', () => {
    const activities = [
      createActivity('1', '2024-03-15T08:00:00Z'),
      createActivity('2', '2024-04-15T08:00:00Z'),
      createActivity('3', '2024-02-15T08:00:00Z'),
    ];
    const result = groupActivitiesByMonth(activities);

    expect(result).toHaveLength(3);
  });

  it('sorts groups by date descending (newest month first)', () => {
    const activities = [
      createActivity('1', '2024-01-15T08:00:00Z'),
      createActivity('2', '2024-06-15T08:00:00Z'),
      createActivity('3', '2024-03-15T08:00:00Z'),
    ];
    const result = groupActivitiesByMonth(activities);

    expect(result[0]?.key).toBe('2024-06');
    expect(result[1]?.key).toBe('2024-03');
    expect(result[2]?.key).toBe('2024-01');
  });

  it('sorts activities within each group by date descending', () => {
    const activities = [
      createActivity('1', '2024-03-05T08:00:00Z', 'First'),
      createActivity('2', '2024-03-25T08:00:00Z', 'Last'),
      createActivity('3', '2024-03-15T08:00:00Z', 'Middle'),
    ];
    const result = groupActivitiesByMonth(activities);

    expect(result[0]?.activities[0]?.name).toBe('Last');
    expect(result[0]?.activities[1]?.name).toBe('Middle');
    expect(result[0]?.activities[2]?.name).toBe('First');
  });

  it('handles activities across years', () => {
    const activities = [
      createActivity('1', '2023-12-15T08:00:00Z'),
      createActivity('2', '2024-01-15T08:00:00Z'),
    ];
    const result = groupActivitiesByMonth(activities);

    expect(result).toHaveLength(2);
    expect(result[0]?.key).toBe('2024-01');
    expect(result[0]?.label).toBe('January 2024');
    expect(result[1]?.key).toBe('2023-12');
    expect(result[1]?.label).toBe('December 2023');
  });

  it('formats month labels correctly', () => {
    const activities = [
      createActivity('1', '2024-01-15T08:00:00Z'),
      createActivity('2', '2024-06-15T08:00:00Z'),
      createActivity('3', '2024-12-15T08:00:00Z'),
    ];
    const result = groupActivitiesByMonth(activities);

    expect(result[0]?.label).toBe('December 2024');
    expect(result[1]?.label).toBe('June 2024');
    expect(result[2]?.label).toBe('January 2024');
  });
});
