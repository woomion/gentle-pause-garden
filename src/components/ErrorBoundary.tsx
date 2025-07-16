
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary componentDidCatch:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen min-h-[100dvh] bg-cream dark:bg-background flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-black dark:text-foreground text-lg mb-4">Something went wrong</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button 
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="bg-lavender text-black px-4 py-2 rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
