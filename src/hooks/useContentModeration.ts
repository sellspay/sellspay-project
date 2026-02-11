import { useState, useCallback } from "react";
import { moderateContent, sanitizeOutput, getContentWarning, type ModerationResult } from "@/utils/contentModeration";
import { toast } from "sonner";

/**
 * Hook for enforcing content moderation on AI tool prompts.
 * Call `validatePrompt(text)` before submitting to any generation edge function.
 * Returns { isBlocked, warning, moderationResult, validatePrompt, clearModeration }.
 */
export function useContentModeration() {
  const [moderationResult, setModerationResult] = useState<ModerationResult | null>(null);

  const validatePrompt = useCallback((text: string): { safe: boolean; sanitized: string } => {
    const result = moderateContent(text);
    setModerationResult(result);

    if (!result.safe) {
      const warning = getContentWarning(result);
      toast.error(warning || "Content blocked due to policy violation.");
      return { safe: false, sanitized: text };
    }

    // If there are medium/low flags, sanitize but allow
    if (result.flags.length > 0) {
      const warning = getContentWarning(result);
      if (warning) toast.warning(warning);
      return { safe: true, sanitized: sanitizeOutput(text) };
    }

    return { safe: true, sanitized: text };
  }, []);

  const clearModeration = useCallback(() => {
    setModerationResult(null);
  }, []);

  return {
    isBlocked: moderationResult ? !moderationResult.safe : false,
    warning: moderationResult ? getContentWarning(moderationResult) : null,
    moderationResult,
    validatePrompt,
    clearModeration,
  };
}
