import { X, Wrench } from "lucide-react";

interface FixErrorToastProps {
  error: string;
  onFix: () => void;
  onDismiss: () => void;
}

export function FixErrorToast({ error, onFix, onDismiss }: FixErrorToastProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(560px,calc(100%-2rem))]">
      <div className="bg-background/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-start gap-3 p-4">
          <div className="mt-0.5 shrink-0 rounded-xl bg-primary/10 text-primary p-2">
            <Wrench className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Build error detected</p>
                <p className="text-xs text-muted-foreground mt-0.5">Click Fix error to auto-repair.</p>
              </div>
              <button
                type="button"
                onClick={onDismiss}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <pre className="mt-3 max-h-20 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-muted/60 border border-border px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
              {error}
            </pre>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={onFix}
                className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-95 transition-opacity"
              >
                Fix error
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
