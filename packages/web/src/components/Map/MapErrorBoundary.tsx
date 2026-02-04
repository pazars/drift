import { Component, type ReactNode } from 'react';

export interface MapErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface MapErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const isWebGLError =
        this.state.error?.message.toLowerCase().includes('webgl') ||
        this.state.error?.message.toLowerCase().includes('context');

      return (
        <div
          className="flex flex-col items-center justify-center h-full bg-gray-100 p-8"
          role="alert"
        >
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Map could not be loaded</h2>
            <p className="text-gray-600 mb-4">
              {isWebGLError
                ? 'Your browser may not support WebGL, or WebGL is disabled. Please check your browser settings or try a different browser.'
                : 'An unexpected error occurred while loading the map.'}
            </p>
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
