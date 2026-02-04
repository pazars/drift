import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivityList } from './ActivityList';
import { ActivityListItem } from './ActivityListItem';
import type { Activity } from '../../types';

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

describe('ActivityList', () => {
  it('renders list of activities', () => {
    render(<ActivityList activities={mockActivities} />);

    expect(screen.getByText('Morning Run')).toBeInTheDocument();
    expect(screen.getByText('Evening Ride')).toBeInTheDocument();
  });

  it('shows empty state when no activities', () => {
    render(<ActivityList activities={[]} />);

    expect(screen.getByText(/no activities/i)).toBeInTheDocument();
  });

  it('calls onSelect when activity is clicked', () => {
    const onSelect = vi.fn();
    render(<ActivityList activities={mockActivities} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Morning Run'));

    expect(onSelect).toHaveBeenCalledWith('activity-1');
  });

  it('highlights selected activity', () => {
    render(<ActivityList activities={mockActivities} selectedActivityId="activity-1" />);

    const selectedItem = screen.getByText('Morning Run').closest('[data-testid]');
    expect(selectedItem).toHaveAttribute('data-selected', 'true');
  });

  it('shows activity count in header', () => {
    render(<ActivityList activities={mockActivities} />);

    expect(screen.getByText(/2 activities/i)).toBeInTheDocument();
  });
});

describe('ActivityList keyboard navigation', () => {
  it('focuses first activity on arrow down when list has focus', () => {
    render(<ActivityList activities={mockActivities} />);

    const list = screen.getByRole('listbox');
    fireEvent.keyDown(list, { key: 'ArrowDown' });

    const firstItem = screen.getByTestId('activity-item-activity-1');
    expect(firstItem).toHaveFocus();
  });

  it('moves focus down with arrow down key', () => {
    render(<ActivityList activities={mockActivities} />);

    const firstItem = screen.getByTestId('activity-item-activity-1');
    firstItem.focus();
    fireEvent.keyDown(firstItem, { key: 'ArrowDown' });

    const secondItem = screen.getByTestId('activity-item-activity-2');
    expect(secondItem).toHaveFocus();
  });

  it('moves focus up with arrow up key', () => {
    render(<ActivityList activities={mockActivities} />);

    const secondItem = screen.getByTestId('activity-item-activity-2');
    secondItem.focus();
    fireEvent.keyDown(secondItem, { key: 'ArrowUp' });

    const firstItem = screen.getByTestId('activity-item-activity-1');
    expect(firstItem).toHaveFocus();
  });

  it('does not wrap focus at the top', () => {
    render(<ActivityList activities={mockActivities} />);

    const firstItem = screen.getByTestId('activity-item-activity-1');
    firstItem.focus();
    fireEvent.keyDown(firstItem, { key: 'ArrowUp' });

    expect(firstItem).toHaveFocus();
  });

  it('does not wrap focus at the bottom', () => {
    render(<ActivityList activities={mockActivities} />);

    const secondItem = screen.getByTestId('activity-item-activity-2');
    secondItem.focus();
    fireEvent.keyDown(secondItem, { key: 'ArrowDown' });

    expect(secondItem).toHaveFocus();
  });

  it('selects activity on Enter key', () => {
    const onSelect = vi.fn();
    render(<ActivityList activities={mockActivities} onSelect={onSelect} />);

    const firstItem = screen.getByTestId('activity-item-activity-1');
    firstItem.focus();
    fireEvent.keyDown(firstItem, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith('activity-1');
  });

  it('selects activity on Space key', () => {
    const onSelect = vi.fn();
    render(<ActivityList activities={mockActivities} onSelect={onSelect} />);

    const firstItem = screen.getByTestId('activity-item-activity-1');
    firstItem.focus();
    fireEvent.keyDown(firstItem, { key: ' ' });

    expect(onSelect).toHaveBeenCalledWith('activity-1');
  });

  it('has visible focus indicator', () => {
    render(<ActivityList activities={mockActivities} />);

    const firstItem = screen.getByTestId('activity-item-activity-1');
    firstItem.focus();

    expect(firstItem).toHaveClass('focus:ring-2');
  });
});

describe('ActivityListItem', () => {
  const mockActivity = mockActivities[0]!;

  it('displays activity name', () => {
    render(<ActivityListItem activity={mockActivity} />);

    expect(screen.getByText('Morning Run')).toBeInTheDocument();
  });

  it('displays formatted distance', () => {
    render(<ActivityListItem activity={mockActivity} />);

    // 5000m = 5.0 km
    expect(screen.getByText(/5\.0/)).toBeInTheDocument();
  });

  it('displays formatted date', () => {
    render(<ActivityListItem activity={mockActivity} />);

    // Should show some form of date
    expect(screen.getByText(/Jan/)).toBeInTheDocument();
  });

  it('shows sport type color indicator', () => {
    render(<ActivityListItem activity={mockActivity} />);

    const colorIndicator = screen.getByTestId('sport-color');
    expect(colorIndicator).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ActivityListItem activity={mockActivity} onClick={onClick} />);

    fireEvent.click(screen.getByText('Morning Run'));

    expect(onClick).toHaveBeenCalled();
  });

  it('applies selected styling when selected', () => {
    render(<ActivityListItem activity={mockActivity} isSelected />);

    const item = screen.getByTestId(`activity-item-${mockActivity.id}`);
    expect(item).toHaveAttribute('data-selected', 'true');
  });
});
