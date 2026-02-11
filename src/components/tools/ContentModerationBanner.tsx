import { AlertTriangle, ShieldCheck, ShieldAlert, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ModerationResult } from "@/utils/contentModeration";

interface ContentModerationBannerProps {
  result: ModerationResult | null;
  onDismiss: () => void;
}

export function ContentModerationBanner({ result, onDismiss }: ContentModerationBannerProps) {
  if (!result || (result.safe && result.flags.length === 0)) return null;

  const isBlocked = !result.safe;
  const hasWarnings = result.safe && result.flags.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`rounded-xl border p-3 flex items-start gap-3 ${
          isBlocked
            ? "bg-destructive/10 border-destructive/30"
            : "bg-amber-500/10 border-amber-500/30"
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {isBlocked ? (
            <ShieldAlert className="h-4 w-4 text-destructive" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold ${isBlocked ? "text-destructive" : "text-amber-500"}`}>
            {isBlocked ? "Content Blocked" : "Content Warning"}
          </p>
          <ul className="mt-1 space-y-0.5">
            {result.flags.map((flag, i) => (
              <li key={i} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  flag.severity === "high" ? "bg-destructive" :
                  flag.severity === "medium" ? "bg-amber-500" : "bg-muted-foreground"
                }`} />
                {flag.detail}
              </li>
            ))}
          </ul>
          {isBlocked && (
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Please modify your prompt and try again.
            </p>
          )}
          {hasWarnings && (
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Content will be sanitized before saving.
            </p>
          )}
        </div>
        <button onClick={onDismiss} className="shrink-0 p-1 rounded hover:bg-muted transition-colors">
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
