import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeatmapLegend } from './HeatmapLegend';

describe('HeatmapLegend', () => {
  it('renders without crashing', () => {
    render(<HeatmapLegend />);
    expect(screen.getByText('Activity Frequency')).toBeInTheDocument();
  });

  it('displays the title', () => {
    render(<HeatmapLegend />);
    expect(screen.getByText('Activity Frequency')).toBeInTheDocument();
  });

  it('displays Low label', () => {
    render(<HeatmapLegend />);
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('displays High label', () => {
    render(<HeatmapLegend />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders gradient bar with correct background', () => {
    const { container } = render(<HeatmapLegend />);
    const gradientBar = container.querySelector('[style*="linear-gradient"]');
    expect(gradientBar).toBeInTheDocument();
    expect(gradientBar).toHaveStyle({
      background: 'linear-gradient(to right, #fed7aa, #fb923c, #ea580c, #c2410c)',
    });
  });
});
