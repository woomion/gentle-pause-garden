
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
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
    console.error('🚨 ErrorBoundary caught error:', error);
    console.error('🚨 Error stack:', error.stack);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary componentDidCatch:', error, errorInfo);
    console.error('🚨 Component stack:', errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      console.log('🚨 ErrorBoundary rendering error UI');
      return (
        <div className="min-h-screen min-h-[100dvh] bg-cream dark:bg-[#200E3B] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-black dark:text-[#F9F5EB] text-lg mb-4">Something went wrong</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {this.state.error?.message || 'Unknown error'}
            </div>
            {this.state.error?.stack && (
              <details className="text-xs text-gray-500 mb-4 text-left">
                <summary className="cursor-pointer mb-2">Technical Details</summary>
                <pre className="whitespace-pre-wrap break-all bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="space-y-2">
              <button 
                onClick={() => {
                  console.log('🔄 ErrorBoundary: User clicked Try Again');
                  this.setState({ hasError: false, error: undefined, errorInfo: undefined });
                }}
                className="bg-lavender text-black px-4 py-2 rounded mr-2"
              >
                Try Again
              </button>
              <button 
                onClick={() => {
                  console.log('🔄 ErrorBoundary: User clicked Reload Page');
                  window.location.reload();
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
