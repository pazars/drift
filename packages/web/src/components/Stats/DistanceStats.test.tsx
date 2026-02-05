import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DistanceStats } from './DistanceStats';
import type { Activity } from '../../types';

describe('DistanceStats', () => {
  const createActivity = (distance: number): Activity => ({
    id: `activity-${Math.random()}`,
    name: 'Test Activity',
    type: 'run',
    date: '2024-01-15',
    distance,
    duration: 1800,
    polyline: 'abc123',
  });

  it('displays total distance label', () => {
    const activities = [createActivity(5000)];

    render(<DistanceStats activities={activities} />);

    expect(screen.getByText(/total distance/i)).toBeInTheDocument();
  });

  it('calculates total distance from activities in km', () => {
    const activities = [createActivity(5000), createActivity(10000), createActivity(3000)];

    render(<DistanceStats activities={activities} />);

    expect(screen.getByText('18.0 km')).toBeInTheDocument();
  });

  it('shows zero when activities array is empty', () => {
    render(<DistanceStats activities={[]} />);

    expect(screen.getByText('0.0 km')).toBeInTheDocument();
  });

  it('formats large distance values with commas', () => {
    const activities = [createActivity(500000), createActivity(750000)];

    render(<DistanceStats activities={activities} />);

    expect(screen.getByText('1,250.0 km')).toBeInTheDocument();
  });

  it('displays activity count', () => {
    const activities = [createActivity(1000), createActivity(2000), createActivity(3000)];

    render(<DistanceStats activities={activities} />);

    expect(screen.getByText(/from 3 activities/i)).toBeInTheDocument();
  });

  it('uses singular form for one activity', () => {
    const activities = [createActivity(5000)];

    render(<DistanceStats activities={activities} />);

    expect(screen.getByText(/from 1 activity$/i)).toBeInTheDocument();
  });
});
