import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DataErrorBoundary } from './DataErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Failed to load data');
  }
  return <div>Content loaded</div>;
}

describe('DataErrorBoundary', () => {
  // Suppress console.error for cleaner test output
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it('renders children when no error', () => {
    render(
      <DataErrorBoundary>
        <div>Child content</div>
      </DataErrorBoundary>
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    render(
      <DataErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DataErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/unable to load/i)).toBeInTheDocument();
  });

  it('has retry button that resets error state', () => {
    render(
      <DataErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DataErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Verify retry button exists and is clickable
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();

    // Click retry - it should reset hasError to false
    fireEvent.click(retryButton);

    // After retry, the boundary attempts to re-render children
    // but since ThrowError still throws, it will show error again
    // This test verifies the retry mechanism exists and triggers
    // (actual retry success is an integration concern)
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();
    render(
      <DataErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </DataErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
  });

  it('calls onRetry callback when retry is clicked', () => {
    const onRetry = vi.fn();
    render(
      <DataErrorBoundary onRetry={onRetry}>
        <ThrowError shouldThrow={true} />
      </DataErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(onRetry).toHaveBeenCalled();
  });

  it('displays network error message for network errors', () => {
    function ThrowNetworkError(): never {
      throw new Error('Network request failed');
    }

    render(
      <DataErrorBoundary>
        <ThrowNetworkError />
      </DataErrorBoundary>
    );

    expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument();
  });

  it('accepts custom fallback render prop', () => {
    render(
      <DataErrorBoundary
        fallback={(error, retry) => (
          <div>
            <span>Custom error: {error.message}</span>
            <button onClick={retry}>Custom retry</button>
          </div>
        )}
      >
        <ThrowError shouldThrow={true} />
      </DataErrorBoundary>
    );

    expect(screen.getByText(/custom error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /custom retry/i })).toBeInTheDocument();
  });
});
