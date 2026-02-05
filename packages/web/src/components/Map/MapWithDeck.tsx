import { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl } from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { Layer } from '@deck.gl/core';
import { useReducedMotion } from '../../hooks';
import 'maplibre-gl/dist/maplibre-gl.css';

// OpenFreeMap free tile source
const DEFAULT_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export interface MapWithDeckProps {
  styleUrl?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  layers?: Layer[];
  bounds?: { north: number; south: number; east: number; west: number } | undefined;
  onLayersChange?: (layers: Layer[]) => void;
  onError?: (error: Error) => void;
}

export function MapWithDeck({
  styleUrl = DEFAULT_STYLE_URL,
  initialCenter = [0, 0],
  initialZoom = 2,
  layers = [],
  bounds,
  onLayersChange,
  onError,
}: MapWithDeckProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Initialize map and deck.gl overlay
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new Map({
      container: containerRef.current,
      style: styleUrl,
      center: initialCenter,
      zoom: initialZoom,
      // Disable animations when user prefers reduced motion
      fadeDuration: prefersReducedMotion ? 0 : 300,
    });

    map.addControl(new NavigationControl(), 'top-right');

    const overlay = new MapboxOverlay({
      interleaved: true,
      layers: [],
    });

    map.on('load', () => {
      map.addControl(overlay as unknown as maplibregl.IControl);
      overlayRef.current = overlay;
      setMapLoaded(true);
    });

    map.on('error', (e) => {
      if (onError && e.error) {
        onError(e.error as Error);
      }
    });

    mapRef.current = map;

    return () => {
      overlay.finalize();
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
      setMapLoaded(false);
    };
  }, [styleUrl, initialCenter, initialZoom, onError, prefersReducedMotion]);

  // Update layers when they change
  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.setProps({ layers });
      onLayersChange?.(layers);
    }
  }, [layers, onLayersChange]);

  // Fit map to bounds when they change (only after map is loaded)
  useEffect(() => {
    if (mapLoaded && mapRef.current && bounds) {
      mapRef.current.fitBounds(
        [
          [bounds.west, bounds.south],
          [bounds.east, bounds.north],
        ],
        { padding: 50, duration: 0 }
      );
    }
  }, [mapLoaded, bounds]);

  return (
    <div
      ref={containerRef}
      data-testid="map-with-deck-container"
      className="map-with-deck-container"
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    />
  );
}
