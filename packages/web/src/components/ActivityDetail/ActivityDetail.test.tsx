import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivityDetail } from './ActivityDetail';
import type { Activity } from '../../types';

const mockActivity: Activity = {
  id: '1',
  name: 'Morning Run',
  type: 'run',
  date: '2024-01-15',
  distance: 5234, // meters
  duration: 1832, // seconds (30:32)
  elevation: 125, // meters
  polyline: 'abc123',
  tags: ['workout', 'morning'],
  bounds: {
    north: 45.5,
    south: 45.4,
    east: -73.5,
    west: -73.6,
  },
};

describe('ActivityDetail', () => {
  it('displays activity name', () => {
    render(<ActivityDetail activity={mockActivity} />);

    expect(screen.getByText('Morning Run')).toBeInTheDocument();
  });

  it('displays sport type with color indicator', () => {
    render(<ActivityDetail activity={mockActivity} />);

    // Check for the capitalized sport type (not in the title)
    expect(screen.getByText('Run')).toBeInTheDocument();
  });

  it('displays formatted date', () => {
    render(<ActivityDetail activity={mockActivity} />);

    expect(screen.getByText(/jan 15, 2024/i)).toBeInTheDocument();
  });

  it('displays distance in kilometers', () => {
    render(<ActivityDetail activity={mockActivity} />);

    expect(screen.getByText(/5\.23 km/i)).toBeInTheDocument();
  });

  it('displays duration formatted as HH:MM:SS', () => {
    render(<ActivityDetail activity={mockActivity} />);

    expect(screen.getByText(/30:32/)).toBeInTheDocument();
  });

  it('displays elevation gain', () => {
    render(<ActivityDetail activity={mockActivity} />);

    expect(screen.getByText(/125 m/)).toBeInTheDocument();
  });

  it('displays tags as chips', () => {
    render(<ActivityDetail activity={mockActivity} />);

    expect(screen.getByText('workout')).toBeInTheDocument();
    expect(screen.getByText('morning')).toBeInTheDocument();
  });

  it('has close button that calls onClose', () => {
    const onClose = vi.fn();
    render(<ActivityDetail activity={mockActivity} onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('has zoom to fit button that calls onZoomToFit', () => {
    const onZoomToFit = vi.fn();
    render(<ActivityDetail activity={mockActivity} onZoomToFit={onZoomToFit} />);

    const zoomButton = screen.getByRole('button', { name: /zoom to fit/i });
    fireEvent.click(zoomButton);

    expect(onZoomToFit).toHaveBeenCalled();
  });

  it('hides zoom button when activity has no bounds', () => {
    const activityNoBounds = { ...mockActivity, bounds: undefined };
    render(<ActivityDetail activity={activityNoBounds} onZoomToFit={() => {}} />);

    expect(screen.queryByRole('button', { name: /zoom to fit/i })).not.toBeInTheDocument();
  });

  it('handles missing elevation gracefully', () => {
    const activityNoElevation = { ...mockActivity, elevation: undefined };
    render(<ActivityDetail activity={activityNoElevation} />);

    expect(screen.queryByText(/elevation/i)).not.toBeInTheDocument();
  });

  it('handles missing tags gracefully', () => {
    const activityNoTags = { ...mockActivity, tags: undefined };
    render(<ActivityDetail activity={activityNoTags} />);

    expect(screen.queryByText('workout')).not.toBeInTheDocument();
  });

  it('formats duration over an hour correctly', () => {
    const longActivity = { ...mockActivity, duration: 4523 }; // 1:15:23
    render(<ActivityDetail activity={longActivity} />);

    expect(screen.getByText(/1:15:23/)).toBeInTheDocument();
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<ActivityDetail activity={mockActivity} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('does not call onClose on Escape when onClose is not provided', () => {
    // Should not throw
    render(<ActivityDetail activity={mockActivity} />);
    fireEvent.keyDown(document, { key: 'Escape' });
  });
});
