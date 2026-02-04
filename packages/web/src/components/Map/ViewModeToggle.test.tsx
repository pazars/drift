import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ViewModeToggle } from './ViewModeToggle';

describe('ViewModeToggle', () => {
  it('renders tracks and heatmap buttons', () => {
    render(<ViewModeToggle mode="tracks" onChange={() => {}} />);

    expect(screen.getByRole('button', { name: /tracks/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /heatmap/i })).toBeInTheDocument();
  });

  it('shows tracks button as active when mode is tracks', () => {
    render(<ViewModeToggle mode="tracks" onChange={() => {}} />);

    const tracksButton = screen.getByRole('button', { name: /tracks/i });
    expect(tracksButton).toHaveClass('bg-blue-600');
  });

  it('shows heatmap button as active when mode is heatmap', () => {
    render(<ViewModeToggle mode="heatmap" onChange={() => {}} />);

    const heatmapButton = screen.getByRole('button', { name: /heatmap/i });
    expect(heatmapButton).toHaveClass('bg-blue-600');
  });

  it('calls onChange with "tracks" when tracks button clicked', () => {
    const onChange = vi.fn();
    render(<ViewModeToggle mode="heatmap" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /tracks/i }));

    expect(onChange).toHaveBeenCalledWith('tracks');
  });

  it('calls onChange with "heatmap" when heatmap button clicked', () => {
    const onChange = vi.fn();
    render(<ViewModeToggle mode="tracks" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /heatmap/i }));

    expect(onChange).toHaveBeenCalledWith('heatmap');
  });

  it('does not call onChange when already active button is clicked', () => {
    const onChange = vi.fn();
    render(<ViewModeToggle mode="tracks" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /tracks/i }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
