import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { SidebarPanel } from './SidebarPanel';
import { useActivityStore } from '../../stores/activityStore';
import type { Activity } from '../../types';

const mockActivities: Activity[] = [
  {
    id: '1',
    name: 'Morning Run',
    type: 'run',
    date: '2024-01-15',
    distance: 5000,
    duration: 1800,
    polyline: 'abc123',
  },
  {
    id: '2',
    name: 'Evening Ride',
    type: 'ride',
    date: '2024-01-14',
    distance: 25000,
    duration: 3600,
    polyline: 'def456',
  },
  {
    id: '3',
    name: 'Weekend Hike',
    type: 'hike',
    date: '2024-01-13',
    distance: 10000,
    duration: 7200,
    polyline: 'ghi789',
  },
];

describe('SidebarPanel', () => {
  beforeEach(() => {
    // Reset store before each test
    useActivityStore.setState({
      activities: mockActivities,
      selectedActivityId: null,
      filter: {},
      isLoading: false,
      error: null,
    });
  });

  it('renders sport filter', () => {
    render(<SidebarPanel />);

    expect(screen.getByText(/sport type/i)).toBeInTheDocument();
  });

  it('renders activity list', () => {
    render(<SidebarPanel />);

    expect(screen.getByRole('heading', { name: /activities/i })).toBeInTheDocument();
    expect(screen.getByText('Morning Run')).toBeInTheDocument();
    expect(screen.getByText('Evening Ride')).toBeInTheDocument();
    expect(screen.getByText('Weekend Hike')).toBeInTheDocument();
  });

  it('shows all activities when no filter is applied', () => {
    render(<SidebarPanel />);

    expect(screen.getByText('3 activities')).toBeInTheDocument();
  });

  it('filters activities when sport type is toggled off', () => {
    render(<SidebarPanel />);

    // Initially all types are selected (no filter = show all)
    // Click on "run" to deselect it
    const runCheckbox = screen.getByLabelText(/run/i);
    fireEvent.click(runCheckbox);

    // The filter should now exclude runs
    // Since the store now filters by types, we need to wait for the update
    // With our implementation, when a type is toggled, only that type is added to filter
    expect(screen.queryByText('Morning Run')).not.toBeInTheDocument();
    expect(screen.getByText('Evening Ride')).toBeInTheDocument();
    expect(screen.getByText('Weekend Hike')).toBeInTheDocument();
  });

  it('shows correct count when filtered', () => {
    render(<SidebarPanel />);

    // Toggle off 'run'
    const runCheckbox = screen.getByLabelText(/run/i);
    fireEvent.click(runCheckbox);

    expect(screen.getByText('2 activities')).toBeInTheDocument();
  });

  it('updates activity selection when item clicked', () => {
    render(<SidebarPanel />);

    fireEvent.click(screen.getByText('Morning Run'));

    const { selectedActivityId } = useActivityStore.getState();
    expect(selectedActivityId).toBe('1');
  });

  it('clears filter when Clear All is clicked', () => {
    // First set a filter
    useActivityStore.setState({
      filter: { types: ['run'] },
    });

    render(<SidebarPanel />);

    fireEvent.click(screen.getByRole('button', { name: /clear all/i }));

    // Should show no activities when no types are selected
    expect(screen.getByText('0 activities')).toBeInTheDocument();
  });

  it('shows all activities when Select All is clicked', () => {
    // Start with a filter
    useActivityStore.setState({
      filter: { types: ['run'] },
    });

    render(<SidebarPanel />);

    fireEvent.click(screen.getByRole('button', { name: /select all/i }));

    expect(screen.getByText('3 activities')).toBeInTheDocument();
  });

  it('renders date range filter', () => {
    render(<SidebarPanel />);

    expect(screen.getByText(/date range/i)).toBeInTheDocument();
  });

  it('filters activities by date range', () => {
    render(<SidebarPanel />);

    const fromInput = screen.getByLabelText(/from/i);
    const toInput = screen.getByLabelText(/to/i);

    // Set date range to only include Jan 14-15
    fireEvent.change(fromInput, { target: { value: '2024-01-14' } });
    fireEvent.change(toInput, { target: { value: '2024-01-15' } });

    // Should only show 2 activities (Jan 14 and Jan 15)
    expect(screen.getByText('2 activities')).toBeInTheDocument();
    expect(screen.getByText('Morning Run')).toBeInTheDocument();
    expect(screen.getByText('Evening Ride')).toBeInTheDocument();
    expect(screen.queryByText('Weekend Hike')).not.toBeInTheDocument();
  });

  it('clears date filter when All time is clicked', () => {
    // Start with a date filter
    useActivityStore.setState({
      filter: {
        dateRange: { start: '2024-01-14', end: '2024-01-15' },
      },
    });

    render(<SidebarPanel />);

    // Initially should show 2 activities
    expect(screen.getByText('2 activities')).toBeInTheDocument();

    // Click "All time" to clear the filter
    fireEvent.click(screen.getByRole('button', { name: /all time/i }));

    // Should now show all 3 activities
    expect(screen.getByText('3 activities')).toBeInTheDocument();
  });
});
