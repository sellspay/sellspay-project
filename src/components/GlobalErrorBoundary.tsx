import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  retryCount: number;
}

/**
 * Top-level error boundary that catches any uncaught React error
 * and auto-retries once before showing a minimal recovery UI.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, retryCount: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[GlobalErrorBoundary]', error, info);
    // Auto-retry once
    if (this.state.retryCount < 1) {
      setTimeout(() => {
        this.setState(prev => ({ hasError: false, retryCount: prev.retryCount + 1 }));
      }, 500);
    }
  }

  render() {
    if (this.state.hasError && this.state.retryCount >= 1) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-8">
          <div className="text-center space-y-4 max-w-sm">
            <p className="text-lg font-semibold">Something went wrong</p>
            <p className="text-sm text-muted-foreground">An unexpected error occurred.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    return this.props.children;
  }
}
