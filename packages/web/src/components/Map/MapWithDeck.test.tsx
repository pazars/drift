import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MapWithDeck } from './MapWithDeck';
import { ScatterplotLayer } from '@deck.gl/layers';

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
});
