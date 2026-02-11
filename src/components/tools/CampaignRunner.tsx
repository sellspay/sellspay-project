import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2, Circle, Loader2, XCircle,
  Play, Coins, Eye, ChevronDown, ChevronUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { SourceSelector, type SourceMode, type ProductContext } from "./SourceSelector";
import { ProductContextCard } from "./ProductContextCard";
import { cn } from "@/lib/utils";

interface CampaignStep {
  tool_id: string;
  label: string;
}

interface StepState {
  tool_id: string;
  label: string;
  status: "pending" | "running" | "done" | "failed";
  output_summary?: string;
  result?: any;
  error?: string;
}

interface CampaignRunnerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateName: string;
  templateDescription: string;
  steps: CampaignStep[];
  estimatedCredits: number;
  creditBalance: number;
}

export function CampaignRunner({
  open,
  onOpenChange,
  templateId,
  templateName,
  templateDescription,
  steps,
  estimatedCredits,
  creditBalance,
}: CampaignRunnerProps) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<"setup" | "running" | "complete" | "failed">("setup");
  const [sourceMode, setSourceMode] = useState<SourceMode>("blank");
  const [selectedProduct, setSelectedProduct] = useState<ProductContext | null>(null);
  const [stepsState, setStepsState] = useState<StepState[]>(
    steps.map((s) => ({ ...s, status: "pending" }))
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [runId, setRunId] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const abortRef = useRef(false);

  useEffect(() => {
    if (open) {
      setPhase("setup");
      setSourceMode("blank");
      setSelectedProduct(null);
      setStepsState(steps.map((s) => ({ ...s, status: "pending" })));
      setCurrentStep(0);
      setRunId(null);
      setExpandedStep(null);
      setCreditsUsed(0);
      abortRef.current = false;
    }
  }, [open, steps]);

  const hasEnoughCredits = creditBalance >= estimatedCredits;

  const executeStep = useCallback(async (
    stepIndex: number,
    stepData: CampaignStep,
    productCtx: ProductContext | null,
    previousOutputs: Array<{ tool_id: string; result: any }>,
    campaignRunId: string
  ): Promise<{ success: boolean; result?: any; error?: string }> => {
    const { data, error } = await supabase.functions.invoke("run-campaign-step", {
      body: {
        tool_id: stepData.tool_id,
        product_context: productCtx,
        previous_outputs: previousOutputs,
        run_id: campaignRunId,
        step_index: stepIndex,
      },
    });

    if (error) return { success: false, error: error.message };
    if (data?.error) return { success: false, error: data.error };
    return { success: true, result: data?.result };
  }, []);

  const startCampaign = useCallback(async () => {
    if (!user || !hasEnoughCredits) {
      toast.error("Not enough credits");
      return;
    }

    setPhase("running");
    abortRef.current = false;

    // Create campaign run record
    const { data: run, error } = await supabase
      .from("campaign_runs" as any)
      .insert({
        user_id: user.id,
        template_id: templateId,
        product_id: selectedProduct?.id || null,
        product_context: selectedProduct ? (selectedProduct as any) : null,
        status: "running",
        current_step_index: 0,
        steps_state: steps.map((s) => ({ ...s, status: "pending" })),
        started_at: new Date().toISOString(),
      } as any)
      .select("id")
      .single();

    if (error || !run) {
      toast.error("Failed to start campaign");
      setPhase("setup");
      return;
    }

    const campaignRunId = (run as any).id;
    setRunId(campaignRunId);

    const previousOutputs: Array<{ tool_id: string; result: any }> = [];
    let totalUsed = 0;

    for (let i = 0; i < steps.length; i++) {
      if (abortRef.current) break;

      setCurrentStep(i);
      setStepsState((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: "running" } : s))
      );

      const { success, result, error: stepError } = await executeStep(
        i, steps[i], selectedProduct, previousOutputs, campaignRunId
      );

      if (success && result) {
        previousOutputs.push({ tool_id: steps[i].tool_id, result });
        totalUsed += 1;
        setCreditsUsed(totalUsed);

        setStepsState((prev) =>
          prev.map((s, idx) =>
            idx === i ? {
              ...s,
              status: "done",
              result,
              output_summary: summarizeResult(steps[i].tool_id, result),
            } : s
          )
        );
      } else {
        setStepsState((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: "failed", error: stepError || "Unknown error" } : s
          )
        );

        // Mark run as failed
        await supabase
          .from("campaign_runs" as any)
          .update({
            status: "failed",
            error_message: stepError,
            total_credits_used: totalUsed,
          } as any)
          .eq("id", campaignRunId);

        setPhase("failed");
        toast.error(`Step "${steps[i].label}" failed: ${stepError}`);
        return;
      }
    }

    // Mark complete
    await supabase
      .from("campaign_runs" as any)
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        total_credits_used: totalUsed,
      } as any)
      .eq("id", campaignRunId);

    setPhase("complete");
    toast.success(`${templateName} completed!`);
  }, [user, selectedProduct, templateId, steps, hasEnoughCredits, executeStep, templateName]);

  const completedCount = stepsState.filter((s) => s.status === "done").length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            {templateName}
          </DialogTitle>
        </DialogHeader>

        {phase === "setup" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{templateDescription}</p>

            <SourceSelector
              mode={sourceMode}
              onModeChange={setSourceMode}
              selectedProduct={selectedProduct}
              onProductSelect={setSelectedProduct}
            />

            {sourceMode === "product" && selectedProduct && (
              <ProductContextCard
                products={[selectedProduct]}
                onRemove={() => { setSelectedProduct(null); setSourceMode("blank"); }}
              />
            )}

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Steps</span>
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold shrink-0">{i + 1}</span>
                  {step.label}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium">Estimated cost</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs">
                  <Coins className="h-3 w-3" /> ~{estimatedCredits} credits
                </Badge>
                {!hasEnoughCredits && <span className="text-[10px] text-destructive">Not enough</span>}
              </div>
            </div>

            <Button className="w-full gap-2" onClick={startCampaign} disabled={!hasEnoughCredits}>
              <Play className="h-4 w-4" /> Launch Campaign
            </Button>
          </div>
        )}

        {(phase === "running" || phase === "failed") && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
                </span>
                <span className="font-medium text-foreground">{progressPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <ScrollArea className="max-h-72">
              <div className="space-y-2">
                {stepsState.map((step, i) => (
                  <div key={i} className="rounded-lg border transition-colors overflow-hidden">
                    <button
                      onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                      className={cn(
                        "flex items-start gap-3 p-3 w-full text-left transition-colors",
                        step.status === "running" && "border-primary/30 bg-primary/5",
                        step.status === "done" && "bg-card",
                        step.status === "pending" && "bg-card/50",
                        step.status === "failed" && "bg-destructive/5"
                      )}
                    >
                      <div className="mt-0.5">
                        {step.status === "pending" && <Circle className="h-4 w-4 text-muted-foreground" />}
                        {step.status === "running" && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
                        {step.status === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        {step.status === "failed" && <XCircle className="h-4 w-4 text-destructive" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{step.label}</p>
                        {step.output_summary && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{step.output_summary}</p>
                        )}
                        {step.error && (
                          <p className="text-xs text-destructive mt-0.5">{step.error}</p>
                        )}
                      </div>
                      {step.status === "done" && step.result && (
                        <div className="shrink-0">
                          {expandedStep === i ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      )}
                    </button>

                    {/* Expanded output preview */}
                    {expandedStep === i && step.result && (
                      <div className="px-3 pb-3 border-t border-border/50">
                        <pre className="text-[11px] text-muted-foreground bg-muted/50 rounded p-2 mt-2 max-h-32 overflow-auto whitespace-pre-wrap">
                          {JSON.stringify(step.result, null, 2).slice(0, 800)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {phase === "running" && (
              <p className="text-xs text-center text-muted-foreground">Running… don't close this dialog.</p>
            )}
            {phase === "failed" && (
              <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            )}
          </div>
        )}

        {phase === "complete" && (
          <div className="space-y-4 text-center py-4">
            <div className="flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Campaign Complete!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                All {steps.length} steps finished successfully.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="gap-1 text-xs border-amber-500/30 bg-amber-500/10 text-amber-500">
                <Coins className="h-3 w-3" /> {creditsUsed} credits used
              </Badge>
            </div>

            {/* Results preview */}
            <div className="text-left space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Results</span>
              {stepsState.filter(s => s.result).map((step, i) => (
                <button
                  key={i}
                  onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                  className="w-full text-left p-2.5 rounded-lg border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">{step.label}</span>
                    </div>
                    {expandedStep === i ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  {expandedStep === i && (
                    <pre className="text-[11px] text-muted-foreground bg-muted/50 rounded p-2 mt-2 max-h-32 overflow-auto whitespace-pre-wrap">
                      {JSON.stringify(step.result, null, 2).slice(0, 800)}
                    </pre>
                  )}
                </button>
              ))}
            </div>

            <Button className="w-full" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Summarize AI output for display */
function summarizeResult(toolId: string, result: any): string {
  if (!result) return "Done";
  switch (toolId) {
    case "product-description":
      return result.headline || result.description?.slice(0, 80) || "Description generated";
    case "social-posts-pack":
      return `${result.posts?.length || 0} posts generated`;
    case "short-form-script":
      return result.hook || "Script generated";
    case "tts-voiceover":
      return `Voiceover ready (${result.estimated_duration_seconds || "?"}s)`;
    case "caption-hashtags":
      return `${result.captions?.length || 0} captions with hashtags`;
    case "carousel-generator":
      return `${result.slides?.length || 0} slides created`;
    case "subtitle-generator":
      return `${result.subtitles?.length || 0} subtitle entries`;
    case "thumbnail-generator":
      return `${result.concepts?.length || 0} thumbnail concepts`;
    default:
      return "Step completed";
  }
}
