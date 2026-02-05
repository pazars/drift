import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ElevationStats } from './ElevationStats';
import type { Activity } from '../../types';

describe('ElevationStats', () => {
  const createActivity = (elevation?: number): Activity => ({
    id: `activity-${Math.random()}`,
    name: 'Test Activity',
    type: 'run',
    date: '2024-01-15',
    distance: 5000,
    duration: 1800,
    polyline: 'abc123',
    elevation,
  });

  it('displays total elevation gain label', () => {
    const activities = [createActivity(100)];

    render(<ElevationStats activities={activities} />);

    expect(screen.getByText(/total elevation gain/i)).toBeInTheDocument();
  });

  it('calculates total elevation from activities', () => {
    const activities = [createActivity(100), createActivity(200), createActivity(150)];

    render(<ElevationStats activities={activities} />);

    expect(screen.getByText('450 m')).toBeInTheDocument();
  });

  it('handles activities without elevation data', () => {
    const activities = [createActivity(100), createActivity(undefined), createActivity(50)];

    render(<ElevationStats activities={activities} />);

    expect(screen.getByText('150 m')).toBeInTheDocument();
  });

  it('shows zero when no activities have elevation', () => {
    const activities = [createActivity(undefined), createActivity(undefined)];

    render(<ElevationStats activities={activities} />);

    expect(screen.getByText('0 m')).toBeInTheDocument();
  });

  it('shows zero when activities array is empty', () => {
    render(<ElevationStats activities={[]} />);

    expect(screen.getByText('0 m')).toBeInTheDocument();
  });

  it('formats large elevation values with commas', () => {
    const activities = [createActivity(5000), createActivity(7500)];

    render(<ElevationStats activities={activities} />);

    expect(screen.getByText('12,500 m')).toBeInTheDocument();
  });

  it('displays activity count', () => {
    const activities = [createActivity(100), createActivity(200), createActivity(300)];

    render(<ElevationStats activities={activities} />);

    expect(screen.getByText(/from 3 activities/i)).toBeInTheDocument();
  });

  it('uses singular form for one activity', () => {
    const activities = [createActivity(100)];

    render(<ElevationStats activities={activities} />);

    expect(screen.getByText(/from 1 activity$/i)).toBeInTheDocument();
  });
});
