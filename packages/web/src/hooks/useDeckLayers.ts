import { useState, useCallback } from 'react';
import type { Layer } from '@deck.gl/core';

export interface UseDeckLayersReturn {
  layers: Layer[];
  addLayer: (layer: Layer) => void;
  removeLayer: (layerId: string) => void;
  updateLayer: (layer: Layer) => void;
  clearLayers: () => void;
}

export function useDeckLayers(initialLayers: Layer[] = []): UseDeckLayersReturn {
  const [layers, setLayers] = useState<Layer[]>(initialLayers);

  const addLayer = useCallback((layer: Layer) => {
    setLayers((prev) => [...prev, layer]);
  }, []);

  const removeLayer = useCallback((layerId: string) => {
    setLayers((prev) => prev.filter((layer) => layer.id !== layerId));
  }, []);

  const updateLayer = useCallback((updatedLayer: Layer) => {
    setLayers((prev) => prev.map((layer) => (layer.id === updatedLayer.id ? updatedLayer : layer)));
  }, []);

  const clearLayers = useCallback(() => {
    setLayers([]);
  }, []);

  return {
    layers,
    addLayer,
    removeLayer,
    updateLayer,
    clearLayers,
  };
}
