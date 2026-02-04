import { useEffect, useRef } from 'react';
import { Map, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// OpenFreeMap free tile source
const DEFAULT_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export interface MapContainerProps {
  styleUrl?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  onError?: (error: Error) => void;
}

export function MapContainer({
  styleUrl = DEFAULT_STYLE_URL,
  initialCenter = [0, 0],
  initialZoom = 2,
  onError,
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new Map({
      container: containerRef.current,
      style: styleUrl,
      center: initialCenter,
      zoom: initialZoom,
    });

    map.addControl(new NavigationControl(), 'top-right');

    map.on('error', (e) => {
      if (onError && e.error) {
        onError(e.error as Error);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [styleUrl, initialCenter, initialZoom, onError]);

  return (
    <div
      ref={containerRef}
      data-testid="map-container"
      className="map-container"
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
