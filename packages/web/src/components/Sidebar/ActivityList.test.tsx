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

const multiMonthActivities: Activity[] = [
  {
    id: 'march-1',
    name: 'March Run',
    type: 'run',
    date: '2024-03-15T08:00:00Z',
    distance: 5000,
    duration: 1800,
    polyline: 'encoded',
  },
  {
    id: 'march-2',
    name: 'March Ride',
    type: 'ride',
    date: '2024-03-10T08:00:00Z',
    distance: 10000,
    duration: 2400,
    polyline: 'encoded',
  },
  {
    id: 'feb-1',
    name: 'February Walk',
    type: 'walk',
    date: '2024-02-20T08:00:00Z',
    distance: 3000,
    duration: 1200,
    polyline: 'encoded',
  },
  {
    id: 'jan-1',
    name: 'January Hike',
    type: 'hike',
    date: '2024-01-05T08:00:00Z',
    distance: 8000,
    duration: 3600,
    polyline: 'encoded',
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
  // Note: activities are sorted by date descending within each month
  // activity-2 (Jan 16) comes before activity-1 (Jan 15) in the sorted list

  it('focuses first activity on arrow down when list has focus', () => {
    render(<ActivityList activities={mockActivities} />);

    const list = screen.getByRole('listbox');
    fireEvent.keyDown(list, { key: 'ArrowDown' });

    // activity-2 is first in sorted order (Jan 16 > Jan 15)
    const firstItem = screen.getByTestId('activity-item-activity-2');
    expect(firstItem).toHaveFocus();
  });

  it('moves focus down with arrow down key', () => {
    render(<ActivityList activities={mockActivities} />);

    // activity-2 is first (Jan 16), activity-1 is second (Jan 15)
    const firstItem = screen.getByTestId('activity-item-activity-2');
    firstItem.focus();
    fireEvent.keyDown(firstItem, { key: 'ArrowDown' });

    const secondItem = screen.getByTestId('activity-item-activity-1');
    expect(secondItem).toHaveFocus();
  });

  it('moves focus up with arrow up key', () => {
    render(<ActivityList activities={mockActivities} />);

    // activity-1 is second (Jan 15), activity-2 is first (Jan 16)
    const secondItem = screen.getByTestId('activity-item-activity-1');
    secondItem.focus();
    fireEvent.keyDown(secondItem, { key: 'ArrowUp' });

    const firstItem = screen.getByTestId('activity-item-activity-2');
    expect(firstItem).toHaveFocus();
  });

  it('does not wrap focus at the top', () => {
    render(<ActivityList activities={mockActivities} />);

    // activity-2 is first in sorted order
    const firstItem = screen.getByTestId('activity-item-activity-2');
    firstItem.focus();
    fireEvent.keyDown(firstItem, { key: 'ArrowUp' });

    expect(firstItem).toHaveFocus();
  });

  it('does not wrap focus at the bottom', () => {
    render(<ActivityList activities={mockActivities} />);

    // activity-1 is last in sorted order
    const lastItem = screen.getByTestId('activity-item-activity-1');
    lastItem.focus();
    fireEvent.keyDown(lastItem, { key: 'ArrowDown' });

    expect(lastItem).toHaveFocus();
  });

  it('selects activity on Enter key', () => {
    const onSelect = vi.fn();
    render(<ActivityList activities={mockActivities} onSelect={onSelect} />);

    // activity-2 is first in sorted order
    const firstItem = screen.getByTestId('activity-item-activity-2');
    firstItem.focus();
    fireEvent.keyDown(firstItem, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith('activity-2');
  });

  it('selects activity on Space key', () => {
    const onSelect = vi.fn();
    render(<ActivityList activities={mockActivities} onSelect={onSelect} />);

    // activity-2 is first in sorted order
    const firstItem = screen.getByTestId('activity-item-activity-2');
    firstItem.focus();
    fireEvent.keyDown(firstItem, { key: ' ' });

    expect(onSelect).toHaveBeenCalledWith('activity-2');
  });

  it('has visible focus indicator', () => {
    render(<ActivityList activities={mockActivities} />);

    // activity-2 is first in sorted order
    const firstItem = screen.getByTestId('activity-item-activity-2');
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

describe('ActivityList month grouping', () => {
  it('groups activities by month', () => {
    render(<ActivityList activities={multiMonthActivities} />);

    expect(screen.getByText('March 2024')).toBeInTheDocument();
    expect(screen.getByText('February 2024')).toBeInTheDocument();
    expect(screen.getByText('January 2024')).toBeInTheDocument();
  });

  it('shows activity count in month headers', () => {
    render(<ActivityList activities={multiMonthActivities} />);

    // March has 2 activities
    const marchHeader = screen
      .getByText('March 2024')
      .closest('[data-testid="month-header-2024-03"]');
    expect(marchHeader).toHaveTextContent('2');

    // February has 1 activity
    const febHeader = screen
      .getByText('February 2024')
      .closest('[data-testid="month-header-2024-02"]');
    expect(febHeader).toHaveTextContent('1');
  });

  it('expands only the most recent month by default', () => {
    render(<ActivityList activities={multiMonthActivities} />);

    // March (most recent) should be expanded - activities visible
    expect(screen.getByText('March Run')).toBeInTheDocument();
    expect(screen.getByText('March Ride')).toBeInTheDocument();

    // February and January should be collapsed - activities not visible
    expect(screen.queryByText('February Walk')).not.toBeInTheDocument();
    expect(screen.queryByText('January Hike')).not.toBeInTheDocument();
  });

  it('toggles month section on header click', () => {
    render(<ActivityList activities={multiMonthActivities} />);

    // Initially March is expanded, February is collapsed
    expect(screen.getByText('March Run')).toBeInTheDocument();
    expect(screen.queryByText('February Walk')).not.toBeInTheDocument();

    // Click February header to expand it
    fireEvent.click(screen.getByText('February 2024'));
    expect(screen.getByText('February Walk')).toBeInTheDocument();

    // Click March header to collapse it
    fireEvent.click(screen.getByText('March 2024'));
    expect(screen.queryByText('March Run')).not.toBeInTheDocument();
  });

  it('toggles section on Enter key press on header', () => {
    render(<ActivityList activities={multiMonthActivities} />);

    // February is collapsed initially
    expect(screen.queryByText('February Walk')).not.toBeInTheDocument();

    // Focus and press Enter on February header
    const febHeader = screen.getByTestId('month-header-2024-02');
    febHeader.focus();
    fireEvent.keyDown(febHeader, { key: 'Enter' });

    expect(screen.getByText('February Walk')).toBeInTheDocument();
  });

  it('toggles section on Space key press on header', () => {
    render(<ActivityList activities={multiMonthActivities} />);

    // February is collapsed initially
    expect(screen.queryByText('February Walk')).not.toBeInTheDocument();

    // Focus and press Space on February header
    const febHeader = screen.getByTestId('month-header-2024-02');
    febHeader.focus();
    fireEvent.keyDown(febHeader, { key: ' ' });

    expect(screen.getByText('February Walk')).toBeInTheDocument();
  });

  it('has correct accessibility attributes on month headers', () => {
    render(<ActivityList activities={multiMonthActivities} />);

    const marchHeader = screen.getByTestId('month-header-2024-03');
    expect(marchHeader).toHaveAttribute('role', 'button');
    expect(marchHeader).toHaveAttribute('aria-expanded', 'true');
    expect(marchHeader).toHaveAttribute('tabIndex', '0');

    const febHeader = screen.getByTestId('month-header-2024-02');
    expect(febHeader).toHaveAttribute('aria-expanded', 'false');
  });

  it('has correct accessibility attributes on sections', () => {
    render(<ActivityList activities={multiMonthActivities} />);

    const marchSection = screen.getByTestId('month-section-2024-03');
    expect(marchSection).toHaveAttribute('role', 'region');
    expect(marchSection).toHaveAttribute('aria-labelledby', 'month-header-2024-03');
  });
});

describe('ActivityList keyboard navigation with month groups', () => {
  it('navigates between activities in expanded sections', () => {
    render(<ActivityList activities={multiMonthActivities} />);

    // March is expanded with 2 activities
    const firstItem = screen.getByTestId('activity-item-march-1');
    const secondItem = screen.getByTestId('activity-item-march-2');

    firstItem.focus();
    fireEvent.keyDown(firstItem, { key: 'ArrowDown' });
    expect(secondItem).toHaveFocus();

    fireEvent.keyDown(secondItem, { key: 'ArrowUp' });
    expect(firstItem).toHaveFocus();
  });

  it('preserves activity selection when toggling months', () => {
    const onSelect = vi.fn();
    render(
      <ActivityList
        activities={multiMonthActivities}
        selectedActivityId="march-1"
        onSelect={onSelect}
      />
    );

    // Collapse March
    fireEvent.click(screen.getByText('March 2024'));

    // Expand March again
    fireEvent.click(screen.getByText('March 2024'));

    // Selected activity should still be selected
    const selectedItem = screen.getByText('March Run').closest('[data-testid]');
    expect(selectedItem).toHaveAttribute('data-selected', 'true');
  });
});
