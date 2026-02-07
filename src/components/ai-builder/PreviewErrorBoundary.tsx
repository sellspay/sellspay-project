import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Sparkles, RefreshCcw } from 'lucide-react';
import { nukeSandpackCache } from '@/utils/storageNuke';

interface Props {
  children: ReactNode;
  onAutoFix: (errorMsg: string) => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for the Vibecoder preview.
 * Catches runtime crashes and provides an "Auto-Fix with AI" button.
 */
export class PreviewErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PreviewErrorBoundary] Crash detected:', error, errorInfo);
  }

  handleAutoFix = () => {
    if (this.state.error && this.props.onAutoFix) {
      // Format the error message for the AI
      const errorReport = `CRITICAL_ERROR_REPORT: The preview crashed with the following error: "${this.state.error.message}". Analyze the code I just wrote, identify the cause (e.g., missing import, undefined variable, syntax error), and fix it immediately. Do NOT ask questions - just fix the code.`;
      
      this.props.onAutoFix(errorReport);
      this.setState({ hasError: false, error: null });
    }
  };

  handleManualReset = async () => {
    // 🔥 Scorched Earth: Nuke all Sandpack caches before resetting
    // This ensures a clean slate when the preview remounts
    await nukeSandpackCache();
    
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      // DON'T render any error UI here - FixErrorToast at bottom handles everything
      // Just call the auto-fix handler to notify parent
      return (
        <div className="h-full w-full flex items-center justify-center bg-muted/20">
          {/* Minimal fallback - no visible error UI since FixErrorToast is shown */}
          <div className="text-center p-8">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="text-muted-foreground" size={24} />
            </div>
            <p className="text-sm text-muted-foreground">Preview paused due to error</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Use the fix button below</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
