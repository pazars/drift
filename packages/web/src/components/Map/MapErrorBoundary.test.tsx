import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { MapErrorBoundary } from './MapErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('WebGL context lost');
  }
  return <div>Map loaded</div>;
}

describe('MapErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when no error occurs', () => {
    render(
      <MapErrorBoundary>
        <ThrowError shouldThrow={false} />
      </MapErrorBoundary>
    );

    expect(screen.getByText('Map loaded')).toBeInTheDocument();
  });

  it('displays error message when child throws', () => {
    render(
      <MapErrorBoundary>
        <ThrowError shouldThrow={true} />
      </MapErrorBoundary>
    );

    expect(screen.getByText(/map could not be loaded/i)).toBeInTheDocument();
  });

  it('displays WebGL-specific message for WebGL errors', () => {
    render(
      <MapErrorBoundary>
        <ThrowError shouldThrow={true} />
      </MapErrorBoundary>
    );

    expect(screen.getByText(/WebGL/i)).toBeInTheDocument();
  });

  it('provides retry functionality', () => {
    render(
      <MapErrorBoundary>
        <ThrowError shouldThrow={true} />
      </MapErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <MapErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </MapErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
  });
});
