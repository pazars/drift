import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock maplibre-gl since it requires WebGL which jsdom doesn't support
class MockMap {
  private handlers: Map<string, Array<(...args: unknown[]) => void>> = new Map();
  private _removed = false;

  constructor(options: { container: HTMLElement | string }) {
    // Store reference to container element (used for initialization)
    void options.container;
  }

  on(event: string, handler: (...args: unknown[]) => void): this {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);

    // Simulate load event firing asynchronously
    if (event === 'load') {
      setTimeout(() => {
        this.handlers.get('load')?.forEach((h) => h());
      }, 0);
    }
    return this;
  }

  off(event: string, handler: (...args: unknown[]) => void): this {
    const handlers = this.handlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
    return this;
  }

  remove(): void {
    this._removed = true;
    this.handlers.clear();
  }

  isRemoved(): boolean {
    return this._removed;
  }

  addControl(_control: unknown, _position?: string): this {
    return this;
  }

  // Simulate error for testing
  triggerError(error: Error): void {
    this.handlers.get('error')?.forEach((h) => h({ error }));
  }
}

class MockNavigationControl {
  constructor(_options?: { showCompass?: boolean; showZoom?: boolean }) {}
}

vi.mock('maplibre-gl', () => ({
  Map: MockMap,
  NavigationControl: MockNavigationControl,
}));

// Mock @deck.gl/mapbox MapboxOverlay
class MockMapboxOverlay {
  private layers: unknown[] = [];

  constructor(options?: { layers?: unknown[]; interleaved?: boolean }) {
    this.layers = options?.layers ?? [];
  }

  setProps(props: { layers?: unknown[] }): void {
    if (props.layers) {
      this.layers = props.layers;
    }
  }

  finalize(): void {
    this.layers = [];
  }

  onAdd(): HTMLDivElement {
    return document.createElement('div');
  }

  onRemove(): void {}

  getLayers(): unknown[] {
    return this.layers;
  }
}

vi.mock('@deck.gl/mapbox', () => ({
  MapboxOverlay: MockMapboxOverlay,
}));
