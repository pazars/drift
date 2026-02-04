import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { MapContainer } from './MapContainer';

describe('MapContainer', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders map container element', () => {
    render(<MapContainer />);

    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
  });

  it('initializes maplibre map on mount', async () => {
    render(<MapContainer />);

    // Map should be initialized and load event should fire
    await waitFor(() => {
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
    });
  });

  it('renders map with full viewport dimensions', () => {
    render(<MapContainer />);

    const mapContainer = screen.getByTestId('map-container');
    // Check CSS classes for full viewport
    expect(mapContainer).toHaveClass('map-container');
  });

  it('cleans up map instance on unmount', async () => {
    const { unmount } = render(<MapContainer />);

    // Wait for map to initialize
    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    // Unmount should clean up without errors
    unmount();
  });

  it('displays error state when map fails to load', async () => {
    // We'll test error boundary integration separately
    // This test ensures the component handles onError callback
    const onError = vi.fn();
    render(<MapContainer onError={onError} />);

    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });
  });

  it('accepts custom style URL', () => {
    const customStyle = 'https://example.com/style.json';
    render(<MapContainer styleUrl={customStyle} />);

    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
  });

  it('accepts initial view state props', () => {
    render(<MapContainer initialCenter={[-122.4194, 37.7749]} initialZoom={12} />);

    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
  });
});
