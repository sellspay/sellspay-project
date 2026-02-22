import React, { forwardRef } from "react";
import { X, Wrench } from "lucide-react";

interface FixErrorToastProps {
  error: string;
  onFix: () => void;
  onDismiss: () => void;
}

export const FixErrorToast = forwardRef<HTMLDivElement, FixErrorToastProps>(
  ({ error, onFix, onDismiss }, ref) => {
  // Truncate very long errors for display
  const displayError = error.length > 150 ? error.slice(0, 150) + '...' : error;
  
  return (
    <div ref={ref} className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(480px,calc(100%-2rem))]">
      <div className="bg-background/95 backdrop-blur-xl border border-border rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center gap-3 p-3">
          {/* Icon */}
          <div className="shrink-0 rounded-lg bg-destructive/10 text-destructive p-2">
            <Wrench className="h-4 w-4" />
          </div>

          {/* Content - Compact */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Build error</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate" title={error}>
              {displayError}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onFix}
              className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Fix
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  }
);

FixErrorToast.displayName = "FixErrorToast";
