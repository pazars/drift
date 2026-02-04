import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useDeckLayers } from './useDeckLayers';
import { ScatterplotLayer } from '@deck.gl/layers';

describe('useDeckLayers', () => {
  it('initializes with empty layers array', () => {
    const { result } = renderHook(() => useDeckLayers());

    expect(result.current.layers).toEqual([]);
  });

  it('adds a layer', () => {
    const { result } = renderHook(() => useDeckLayers());

    const testLayer = new ScatterplotLayer({
      id: 'test-layer',
      data: [],
      getPosition: (_d: unknown) => [0, 0],
      getRadius: 100,
    });

    act(() => {
      result.current.addLayer(testLayer);
    });

    expect(result.current.layers).toHaveLength(1);
    expect(result.current.layers[0]?.id).toBe('test-layer');
  });

  it('removes a layer by id', () => {
    const { result } = renderHook(() => useDeckLayers());

    const testLayer = new ScatterplotLayer({
      id: 'test-layer',
      data: [],
      getPosition: (_d: unknown) => [0, 0],
      getRadius: 100,
    });

    act(() => {
      result.current.addLayer(testLayer);
    });

    expect(result.current.layers).toHaveLength(1);

    act(() => {
      result.current.removeLayer('test-layer');
    });

    expect(result.current.layers).toHaveLength(0);
  });

  it('updates an existing layer', () => {
    const { result } = renderHook(() => useDeckLayers());

    const testLayer = new ScatterplotLayer({
      id: 'test-layer',
      data: [],
      getPosition: (_d: unknown) => [0, 0],
      getRadius: 100,
    });

    act(() => {
      result.current.addLayer(testLayer);
    });

    const updatedLayer = new ScatterplotLayer({
      id: 'test-layer',
      data: [{ position: [0, 0] }],
      getPosition: (_d: unknown) => [0, 0],
      getRadius: 200,
    });

    act(() => {
      result.current.updateLayer(updatedLayer);
    });

    expect(result.current.layers).toHaveLength(1);
  });

  it('clears all layers', () => {
    const { result } = renderHook(() => useDeckLayers());

    const layer1 = new ScatterplotLayer({
      id: 'layer-1',
      data: [],
      getPosition: (_d: unknown) => [0, 0],
      getRadius: 100,
    });

    const layer2 = new ScatterplotLayer({
      id: 'layer-2',
      data: [],
      getPosition: (_d: unknown) => [0, 0],
      getRadius: 100,
    });

    act(() => {
      result.current.addLayer(layer1);
      result.current.addLayer(layer2);
    });

    expect(result.current.layers).toHaveLength(2);

    act(() => {
      result.current.clearLayers();
    });

    expect(result.current.layers).toHaveLength(0);
  });

  it('initializes with provided layers', () => {
    const initialLayer = new ScatterplotLayer({
      id: 'initial-layer',
      data: [],
      getPosition: (_d: unknown) => [0, 0],
      getRadius: 100,
    });

    const { result } = renderHook(() => useDeckLayers([initialLayer]));

    expect(result.current.layers).toHaveLength(1);
    expect(result.current.layers[0]?.id).toBe('initial-layer');
  });
});
