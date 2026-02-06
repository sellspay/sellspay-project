import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Sparkles, RefreshCcw } from 'lucide-react';

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

  handleManualReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-red-950/90 text-red-200 p-8 text-center backdrop-blur-sm relative overflow-hidden">
          {/* Background Pulse */}
          <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
          
          <div className="relative z-10 flex flex-col items-center max-w-md">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
              <AlertTriangle className="text-white" size={32} />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2">Build Failed</h3>
            
            {/* Error Message */}
            <div className="w-full mb-8">
              <p className="text-sm font-mono bg-black/50 p-4 rounded-lg border border-red-500/30 text-red-300 text-left overflow-auto max-h-32 shadow-inner break-words">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full">
              {/* Auto-Fix Button */}
              <button 
                onClick={this.handleAutoFix}
                className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-xl hover:scale-105 transition-all shadow-xl hover:shadow-2xl w-full"
              >
                <div className="absolute inset-0 bg-violet-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <Sparkles size={20} className="text-violet-600 animate-pulse relative z-10" />
                <span className="relative z-10">Auto-Fix with AI</span>
              </button>
              
              {/* Manual Reset Button */}
              <button 
                onClick={this.handleManualReset}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/20 text-red-200 font-medium rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
              >
                <RefreshCcw size={16} />
                <span>Reset Preview</span>
              </button>
            </div>
            
            <p className="mt-6 text-xs text-red-400/80">
              The AI will analyze the error log and rewrite the code.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
