import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="h-screen flex items-center justify-center bg-background p-8">
          <div className="max-w-md w-full">
            <div className="bg-error/10 border border-error/20 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Something went wrong
                    </h3>
                    <p className="text-sm text-muted mt-1">
                      The application encountered an unexpected error. Your work has been saved.
                    </p>
                  </div>
                  
                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-error hover:underline">
                        Show error details
                      </summary>
                      <pre className="mt-2 p-2 bg-surface rounded text-muted overflow-auto max-h-40">
                        {this.state.error.toString()}
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                  
                  <button
                    onClick={this.handleReset}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
                  >
                    Reload Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;