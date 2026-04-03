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
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-xl">
      <div className="px-3 sm:px-4 md:px-8 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">
            AI Studio
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            Tools for audio creation, cleanup, and editing.
          </p>
        </div>

        <div className="shrink-0">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-border bg-muted/30">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Credits</span>
            <span className="text-base font-bold text-foreground tabular-nums">
              {isLoadingCredits ? "…" : creditBalance}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
