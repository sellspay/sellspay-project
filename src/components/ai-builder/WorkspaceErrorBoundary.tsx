import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nukeSandpackCache } from "@/utils/storageNuke";

interface WorkspaceErrorBoundaryProps {
  children: ReactNode;
}

interface WorkspaceErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

/**
 * Catches any crash in the AI Builder workspace (chat/sidebar/preview).
 * Goal: never allow a blank-screen meltdown — always provide recovery actions.
 */
export class WorkspaceErrorBoundary extends Component<
  WorkspaceErrorBoundaryProps,
  WorkspaceErrorBoundaryState
> {
  state: WorkspaceErrorBoundaryState = {
    hasError: false,
    errorMessage: null,
  };

  static getDerivedStateFromError(error: Error): WorkspaceErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message ?? "Unknown error" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[WorkspaceErrorBoundary] AI Builder crashed:", error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleNukeAndReload = async () => {
    try {
      await nukeSandpackCache();
    } finally {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-muted p-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-foreground">
                AI Builder crashed
              </h1>
              <p className="mt-1 text-sm text-muted-foreground break-words">
                {this.state.errorMessage}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                This is a recovery screen so you don’t lose the workspace entirely.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={this.handleReload} variant="secondary" className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Reload
            </Button>
            <Button
              onClick={this.handleNukeAndReload}
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Nuke & Reload
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
