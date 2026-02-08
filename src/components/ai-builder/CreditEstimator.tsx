import React, { useMemo } from "react";
import { Coins, Zap, TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Model weight lookup - synced with backend ai_model_weights table
const MODEL_WEIGHTS: Record<string, { baseCostPer1kTokens: number; flatCost?: number; modelClass: string }> = {
  // Flash tier (cheap/fast)
  'vibecoder-flash': { baseCostPer1kTokens: 0.3, modelClass: 'flash' },
  'google/gemini-3-flash-preview': { baseCostPer1kTokens: 0.5, modelClass: 'flash' },
  'google/gemini-2.5-flash': { baseCostPer1kTokens: 0.4, modelClass: 'flash' },
  'google/gemini-2.5-flash-lite': { baseCostPer1kTokens: 0.2, modelClass: 'flash' },
  'openai/gpt-5-nano': { baseCostPer1kTokens: 0.6, modelClass: 'flash' },
  
  // Standard tier
  'openai/gpt-5-mini': { baseCostPer1kTokens: 1.5, modelClass: 'standard' },
  
  // Pro tier
  'vibecoder-pro': { baseCostPer1kTokens: 3.0, modelClass: 'pro' },
  'google/gemini-3-pro-preview': { baseCostPer1kTokens: 3.0, modelClass: 'pro' },
  'google/gemini-2.5-pro': { baseCostPer1kTokens: 2.5, modelClass: 'pro' },
  'openai/gpt-5': { baseCostPer1kTokens: 4.0, modelClass: 'pro' },
  
  // Flagship tier
  'reasoning-o1': { baseCostPer1kTokens: 6.0, modelClass: 'flagship' },
  'openai/gpt-5.2': { baseCostPer1kTokens: 6.0, modelClass: 'flagship' },
  
  // Image generation (flat cost)
  'nano-banana': { baseCostPer1kTokens: 0, flatCost: 5, modelClass: 'standard' },
  'flux-pro': { baseCostPer1kTokens: 0, flatCost: 8, modelClass: 'pro' },
  'recraft-v3': { baseCostPer1kTokens: 0, flatCost: 8, modelClass: 'pro' },
  
  // Video generation (flat cost)
  'luma-ray-2': { baseCostPer1kTokens: 0, flatCost: 25, modelClass: 'flagship' },
  'kling-video': { baseCostPer1kTokens: 0, flatCost: 25, modelClass: 'flagship' },
};

// Estimate tokens from prompt length (rough heuristic: ~4 chars per token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Keywords that indicate more complex operations
const COMPLEXITY_KEYWORDS = {
  high: ['build', 'create', 'full', 'complete', 'entire', 'generate', 'architect', 'redesign'],
  medium: ['add', 'change', 'update', 'modify', 'fix', 'adjust'],
  low: ['color', 'text', 'font', 'spacing', 'padding', 'margin', 'size'],
};

function getComplexityMultiplier(prompt: string): { multiplier: number; label: string } {
  const lower = prompt.toLowerCase();
  
  if (COMPLEXITY_KEYWORDS.high.some(kw => lower.includes(kw))) {
    return { multiplier: 1.5, label: 'Complex' };
  }
  if (COMPLEXITY_KEYWORDS.low.some(kw => lower.includes(kw))) {
    return { multiplier: 0.7, label: 'Simple' };
  }
  return { multiplier: 1.0, label: 'Standard' };
}

interface CreditEstimatorProps {
  prompt: string;
  modelId: string;
  isPlanMode?: boolean;
  isAutoMode?: boolean;
  className?: string;
  variant?: 'inline' | 'badge' | 'detailed';
}

export function CreditEstimator({ 
  prompt, 
  modelId, 
  isPlanMode = false,
  isAutoMode = false,
  className,
  variant = 'badge',
}: CreditEstimatorProps) {
  const estimate = useMemo(() => {
    if (!prompt.trim()) {
      return null;
    }

    const modelWeight = MODEL_WEIGHTS[modelId] || { baseCostPer1kTokens: 2.0, modelClass: 'standard' };
    
    // Flat cost models (image/video)
    if (modelWeight.flatCost) {
      let cost = modelWeight.flatCost;
      if (isPlanMode) cost *= 2;
      if (isAutoMode) cost *= 1.2;
      return {
        low: Math.ceil(cost),
        high: Math.ceil(cost),
        isFlat: true,
        complexity: 'Fixed',
      };
    }

    // Token-based estimation
    const inputTokens = estimateTokens(prompt);
    // Estimate output tokens based on complexity (typically 2-5x input for code generation)
    const { multiplier, label } = getComplexityMultiplier(prompt);
    const estimatedOutputTokens = inputTokens * (2 + multiplier * 2);
    const totalTokens = inputTokens + estimatedOutputTokens;
    
    // Calculate base cost
    const baseCost = modelWeight.baseCostPer1kTokens * (totalTokens / 1000);
    
    // Apply multipliers
    let finalCost = baseCost * multiplier;
    if (isPlanMode) finalCost *= 2;
    if (isAutoMode) finalCost *= 1.2;
    
    // Return a range (±30%)
    const lowEstimate = Math.max(1, Math.floor(finalCost * 0.7));
    const highEstimate = Math.ceil(finalCost * 1.3);
    
    return {
      low: lowEstimate,
      high: highEstimate,
      isFlat: false,
      complexity: label,
      tokens: totalTokens,
    };
  }, [prompt, modelId, isPlanMode, isAutoMode]);

  if (!estimate) {
    return null;
  }

  // Badge variant - compact inline display
  if (variant === 'badge') {
    const isFree = estimate.low === 0 && estimate.high === 0;
    const displayText = isFree 
      ? 'Free' 
      : estimate.low === estimate.high 
        ? `${estimate.low}c` 
        : `${estimate.low}-${estimate.high}c`;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all",
              isFree 
                ? "bg-green-500/20 text-green-400" 
                : "bg-zinc-700/50 text-zinc-300",
              className
            )}>
              <Zap size={10} className={isFree ? "text-green-400" : "text-amber-400"} />
              <span>~{displayText}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-zinc-900 border-zinc-700 text-xs">
            <div className="space-y-1">
              <p className="font-medium text-white">Estimated Cost</p>
              <p className="text-zinc-400">
                {estimate.isFlat ? 'Fixed cost per generation' : `${estimate.complexity} complexity`}
              </p>
              {!estimate.isFlat && estimate.tokens && (
                <p className="text-zinc-500">~{estimate.tokens.toLocaleString()} tokens</p>
              )}
              {(isPlanMode || isAutoMode) && (
                <div className="pt-1 border-t border-zinc-700 space-y-0.5">
                  {isPlanMode && <p className="text-violet-400">+2x Plan Mode</p>}
                  {isAutoMode && <p className="text-amber-400">+1.2x Auto Mode</p>}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Detailed variant - full breakdown
  if (variant === 'detailed') {
    return (
      <div className={cn(
        "p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 space-y-2",
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Coins size={14} className="text-amber-400" />
            <span>Estimated Cost</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-bold text-white">
            {estimate.low === estimate.high ? (
              <span>{estimate.low} credits</span>
            ) : (
              <span>{estimate.low} - {estimate.high} credits</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-1">
            <TrendingUp size={10} />
            <span>{estimate.complexity}</span>
          </div>
          {!estimate.isFlat && estimate.tokens && (
            <span>~{estimate.tokens.toLocaleString()} tokens</span>
          )}
        </div>

        {(isPlanMode || isAutoMode) && (
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-700">
            {isPlanMode && (
              <span className="px-1.5 py-0.5 bg-violet-500/20 text-violet-400 text-[10px] rounded">
                Plan Mode 2x
              </span>
            )}
            {isAutoMode && (
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded">
                Auto 1.2x
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Inline variant - minimal text
  return (
    <span className={cn("text-zinc-500 text-xs", className)}>
      ~{estimate.low === estimate.high ? estimate.low : `${estimate.low}-${estimate.high}`} credits
    </span>
  );
}

// Hook for getting estimate values programmatically
export function useCredestimate(prompt: string, modelId: string, options?: { isPlanMode?: boolean; isAutoMode?: boolean }) {
  return useMemo(() => {
    if (!prompt.trim()) return null;

    const modelWeight = MODEL_WEIGHTS[modelId] || { baseCostPer1kTokens: 2.0, modelClass: 'standard' };
    
    if (modelWeight.flatCost) {
      let cost = modelWeight.flatCost;
      if (options?.isPlanMode) cost *= 2;
      if (options?.isAutoMode) cost *= 1.2;
      return { low: Math.ceil(cost), high: Math.ceil(cost) };
    }

    const inputTokens = estimateTokens(prompt);
    const { multiplier } = getComplexityMultiplier(prompt);
    const estimatedOutputTokens = inputTokens * (2 + multiplier * 2);
    const totalTokens = inputTokens + estimatedOutputTokens;
    
    let finalCost = modelWeight.baseCostPer1kTokens * (totalTokens / 1000) * multiplier;
    if (options?.isPlanMode) finalCost *= 2;
    if (options?.isAutoMode) finalCost *= 1.2;
    
    return {
      low: Math.max(1, Math.floor(finalCost * 0.7)),
      high: Math.ceil(finalCost * 1.3),
    };
  }, [prompt, modelId, options?.isPlanMode, options?.isAutoMode]);
}
