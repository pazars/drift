import { Component, type ReactNode } from 'react';

export interface DataErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onRetry?: () => void;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface DataErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

function isNetworkError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('timeout')
  );
}

export class DataErrorBoundary extends Component<DataErrorBoundaryProps, DataErrorBoundaryState> {
  constructor(props: DataErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): DataErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.props.onRetry?.();
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      const isNetwork = isNetworkError(this.state.error);

      return (
        <div
          className="flex flex-col items-center justify-center h-full bg-gray-50 p-8"
          role="alert"
        >
          <div className="text-center max-w-md">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to load data</h2>
            <p className="text-gray-600 mb-4">
              {isNetwork
                ? 'Please check your internet connection and try again.'
                : 'Something went wrong while loading the data. Please try again.'}
            </p>
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
