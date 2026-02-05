import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MapWithDeck } from './MapWithDeck';
import { ScatterplotLayer } from '@deck.gl/layers';
import * as maplibre from 'maplibre-gl';

describe('MapWithDeck', () => {
  it('renders map container', () => {
    render(<MapWithDeck />);

    const mapContainer = screen.getByTestId('map-with-deck-container');
    expect(mapContainer).toBeInTheDocument();
  });

  it('initializes with empty layers', async () => {
    render(<MapWithDeck />);

    await waitFor(() => {
      expect(screen.getByTestId('map-with-deck-container')).toBeInTheDocument();
    });
  });

  it('accepts initial layers prop', async () => {
    const testLayer = new ScatterplotLayer({
      id: 'test-scatter',
      data: [],
      getPosition: () => [0, 0],
      getRadius: 100,
    });

    render(<MapWithDeck layers={[testLayer]} />);

    await waitFor(() => {
      expect(screen.getByTestId('map-with-deck-container')).toBeInTheDocument();
    });
  });

  it('calls onLayersChange when layers update', async () => {
    const onLayersChange = vi.fn();
    const testLayer = new ScatterplotLayer({
      id: 'test-scatter',
      data: [],
      getPosition: () => [0, 0],
      getRadius: 100,
    });

    render(<MapWithDeck layers={[testLayer]} onLayersChange={onLayersChange} />);

    await waitFor(() => {
      expect(screen.getByTestId('map-with-deck-container')).toBeInTheDocument();
    });
  });

  it('accepts map style URL', () => {
    const customStyle = 'https://example.com/style.json';
    render(<MapWithDeck styleUrl={customStyle} />);

    const mapContainer = screen.getByTestId('map-with-deck-container');
    expect(mapContainer).toBeInTheDocument();
  });

  it('accepts initial view state', () => {
    render(<MapWithDeck initialCenter={[-122.4194, 37.7749]} initialZoom={12} />);

    const mapContainer = screen.getByTestId('map-with-deck-container');
    expect(mapContainer).toBeInTheDocument();
  });

  describe('bounds prop', () => {
    let mockFitBounds: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockFitBounds = vi.fn().mockReturnThis();
      vi.spyOn(maplibre.Map.prototype, 'fitBounds').mockImplementation(
        mockFitBounds as typeof maplibre.Map.prototype.fitBounds
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('calls fitBounds with correct arguments when bounds provided', async () => {
      const bounds = { north: 40, south: 30, east: -100, west: -110 };

      render(<MapWithDeck bounds={bounds} />);

      await waitFor(() => {
        expect(mockFitBounds).toHaveBeenCalledWith(
          [
            [-110, 30],
            [-100, 40],
          ],
          { padding: 50, duration: 0 }
        );
      });
    });

    it('calls fitBounds again when bounds change', async () => {
      const initialBounds = { north: 40, south: 30, east: -100, west: -110 };
      const newBounds = { north: 50, south: 40, east: -90, west: -100 };

      const { rerender } = render(<MapWithDeck bounds={initialBounds} />);

      await waitFor(() => {
        expect(mockFitBounds).toHaveBeenCalledWith(
          [
            [-110, 30],
            [-100, 40],
          ],
          { padding: 50, duration: 0 }
        );
      });

      rerender(<MapWithDeck bounds={newBounds} />);

      await waitFor(() => {
        expect(mockFitBounds).toHaveBeenCalledWith(
          [
            [-100, 40],
            [-90, 50],
          ],
          { padding: 50, duration: 0 }
        );
      });
    });
  });
});
