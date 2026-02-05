import { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl } from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { Layer } from '@deck.gl/core';
import { useReducedMotion } from '../../hooks';
import 'maplibre-gl/dist/maplibre-gl.css';

// OpenFreeMap free tile source
const DEFAULT_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const DEFAULT_CENTER: [number, number] = [0, 0];
const DEFAULT_ZOOM = 2;

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
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  layers = [],
  bounds,
  onLayersChange,
  onError,
}: MapWithDeckProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const [isReady, setIsReady] = useState(false);
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
      setIsReady(true);
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
      setIsReady(false);
    };
  }, [styleUrl, initialCenter, initialZoom, onError, prefersReducedMotion]);

  // Update layers when they change or when map becomes ready
  useEffect(() => {
    if (isReady && overlayRef.current && layers.length > 0) {
      // Use requestAnimationFrame to ensure overlay is fully initialized
      const frameId = requestAnimationFrame(() => {
        if (overlayRef.current) {
          overlayRef.current.setProps({ layers });
          onLayersChange?.(layers);
        }
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [isReady, layers, onLayersChange]);

  // Fit map to bounds when they change or when map becomes ready
  useEffect(() => {
    if (isReady && mapRef.current && bounds) {
      mapRef.current.fitBounds(
        [
          [bounds.west, bounds.south],
          [bounds.east, bounds.north],
        ],
        { padding: 50, duration: 0 }
      );
    }
  }, [isReady, bounds]);

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
