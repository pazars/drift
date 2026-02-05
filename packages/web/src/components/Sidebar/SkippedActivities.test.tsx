import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SkippedActivities } from './SkippedActivities';
import type { SkippedActivity } from '../../stores/activityStore';

const mockSkippedActivities: SkippedActivity[] = [
  {
    id: 'skipped-1',
    name: 'Treadmill Run',
    date: '2024-01-15T08:00:00Z',
    reason: 'No GPS data (treadmill, indoor, or manual entry)',
  },
  {
    id: 'skipped-2',
    name: 'Indoor Cycling',
    date: '2024-01-16T18:00:00Z',
    reason: 'No GPS data (treadmill, indoor, or manual entry)',
  },
];

describe('SkippedActivities', () => {
  it('renders nothing when there are no skipped activities', () => {
    const { container } = render(<SkippedActivities skippedActivities={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders collapsed by default with count', () => {
    render(<SkippedActivities skippedActivities={mockSkippedActivities} />);

    expect(screen.getByText(/2 skipped/i)).toBeInTheDocument();
    expect(screen.queryByText('Treadmill Run')).not.toBeInTheDocument();
  });

  it('expands when header is clicked', () => {
    render(<SkippedActivities skippedActivities={mockSkippedActivities} />);

    fireEvent.click(screen.getByTestId('skipped-activities-header'));

    expect(screen.getByText('Treadmill Run')).toBeInTheDocument();
    expect(screen.getByText('Indoor Cycling')).toBeInTheDocument();
  });

  it('collapses when header is clicked again', () => {
    render(<SkippedActivities skippedActivities={mockSkippedActivities} />);

    const header = screen.getByTestId('skipped-activities-header');
    fireEvent.click(header);
    expect(screen.getByText('Treadmill Run')).toBeInTheDocument();

    fireEvent.click(header);
    expect(screen.queryByText('Treadmill Run')).not.toBeInTheDocument();
  });

  it('expands on Enter key press', () => {
    render(<SkippedActivities skippedActivities={mockSkippedActivities} />);

    const header = screen.getByTestId('skipped-activities-header');
    fireEvent.keyDown(header, { key: 'Enter' });

    expect(screen.getByText('Treadmill Run')).toBeInTheDocument();
  });

  it('expands on Space key press', () => {
    render(<SkippedActivities skippedActivities={mockSkippedActivities} />);

    const header = screen.getByTestId('skipped-activities-header');
    fireEvent.keyDown(header, { key: ' ' });

    expect(screen.getByText('Treadmill Run')).toBeInTheDocument();
  });

  it('shows activity details when expanded', () => {
    render(<SkippedActivities skippedActivities={mockSkippedActivities} />);

    fireEvent.click(screen.getByTestId('skipped-activities-header'));

    expect(screen.getByText('Treadmill Run')).toBeInTheDocument();
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    // Both activities have "No GPS data" in their reason
    expect(screen.getAllByText(/No GPS data/)).toHaveLength(2);
  });

  it('has correct accessibility attributes', () => {
    render(<SkippedActivities skippedActivities={mockSkippedActivities} />);

    const header = screen.getByTestId('skipped-activities-header');
    expect(header).toHaveAttribute('role', 'button');
    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(header).toHaveAttribute('tabIndex', '0');

    fireEvent.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'true');
  });
});
