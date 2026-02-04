import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ElevationProfile } from './ElevationProfile';

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
}));

const mockElevationData = [
  { distance: 0, elevation: 100 },
  { distance: 1000, elevation: 150 },
  { distance: 2000, elevation: 200 },
  { distance: 3000, elevation: 175 },
  { distance: 4000, elevation: 125 },
];

describe('ElevationProfile', () => {
  it('renders the chart container', () => {
    render(<ElevationProfile data={mockElevationData} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('renders the area chart', () => {
    render(<ElevationProfile data={mockElevationData} />);

    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('renders X and Y axes', () => {
    render(<ElevationProfile data={mockElevationData} />);

    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
  });

  it('renders the elevation area', () => {
    render(<ElevationProfile data={mockElevationData} />);

    expect(screen.getByTestId('area')).toBeInTheDocument();
  });

  it('renders a tooltip', () => {
    render(<ElevationProfile data={mockElevationData} />);

    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('shows empty state when no data provided', () => {
    render(<ElevationProfile data={[]} />);

    expect(screen.getByText(/no elevation data/i)).toBeInTheDocument();
  });

  it('accepts custom height', () => {
    render(<ElevationProfile data={mockElevationData} height={300} />);

    // The height is applied to the wrapper
    const wrapper = screen.getByTestId('responsive-container').parentElement;
    expect(wrapper).toHaveStyle({ height: '300px' });
  });

  it('renders with default height when not specified', () => {
    render(<ElevationProfile data={mockElevationData} />);

    const wrapper = screen.getByTestId('responsive-container').parentElement;
    expect(wrapper).toHaveStyle({ height: '200px' });
  });
});
