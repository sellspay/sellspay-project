import { Wallet } from "lucide-react";

interface ToolShowcaseHeaderProps {
  creditBalance: number;
  isLoadingCredits?: boolean;
}

export function ToolShowcaseHeader({
  creditBalance,
  isLoadingCredits,
}: ToolShowcaseHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="px-3 sm:px-4 md:px-8 py-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl md:text-4xl font-serif italic text-foreground truncate">
            AI Studio
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            Tools for audio creation, cleanup, and editing.
          </p>
        </div>

        <div className="shrink-0">
          <div className="flex items-center gap-3 px-4 py-2 border border-border bg-card">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Credits</span>
            <span className="text-lg font-semibold text-foreground tabular-nums">
              {isLoadingCredits ? "…" : creditBalance}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
