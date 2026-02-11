import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2, Circle, Loader2, XCircle,
  Play, ArrowRight, Coins, Package, X
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
  const [phase, setPhase] = useState<"setup" | "running" | "complete">("setup");
  const [sourceMode, setSourceMode] = useState<SourceMode>("blank");
  const [selectedProduct, setSelectedProduct] = useState<ProductContext | null>(null);
  const [stepsState, setStepsState] = useState<StepState[]>(
    steps.map((s) => ({ ...s, status: "pending" }))
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [runId, setRunId] = useState<string | null>(null);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setPhase("setup");
      setSourceMode("blank");
      setSelectedProduct(null);
      setStepsState(steps.map((s) => ({ ...s, status: "pending" })));
      setCurrentStep(0);
      setRunId(null);
    }
  }, [open, steps]);

  const hasEnoughCredits = creditBalance >= estimatedCredits;

  const startCampaign = useCallback(async () => {
    if (!user) return;
    if (!hasEnoughCredits) {
      toast.error("Not enough credits");
      return;
    }

    setPhase("running");

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

    setRunId((run as any).id);

    // Simulate step execution (each step takes ~2s)
    // In production, this would call actual tool endpoints
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      setStepsState((prev) =>
        prev.map((s, idx) =>
          idx === i ? { ...s, status: "running" } : s
        )
      );

      // Simulate processing
      await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 1000));

      // Mark step done (simulated success)
      setStepsState((prev) =>
        prev.map((s, idx) =>
          idx === i
            ? { ...s, status: "done", output_summary: `Generated ${s.label.toLowerCase()} successfully` }
            : s
        )
      );

      // Update DB
      await supabase
        .from("campaign_runs" as any)
        .update({
          current_step_index: i + 1,
          steps_state: stepsState.map((s, idx) =>
            idx <= i ? { ...s, status: "done" } : s
          ),
        } as any)
        .eq("id", (run as any).id);
    }

    // Mark complete
    await supabase
      .from("campaign_runs" as any)
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        total_credits_used: estimatedCredits,
      } as any)
      .eq("id", (run as any).id);

    setPhase("complete");
    toast.success(`${templateName} completed!`);
  }, [user, selectedProduct, templateId, steps, stepsState, hasEnoughCredits, estimatedCredits, templateName]);

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

            {/* Product selection */}
            <SourceSelector
              mode={sourceMode}
              onModeChange={setSourceMode}
              selectedProduct={selectedProduct}
              onProductSelect={setSelectedProduct}
            />

            {sourceMode === "product" && selectedProduct && (
              <ProductContextCard
                products={[selectedProduct]}
                onRemove={() => {
                  setSelectedProduct(null);
                  setSourceMode("blank");
                }}
              />
            )}

            {/* Steps preview */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Steps
              </span>
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold shrink-0">
                    {i + 1}
                  </span>
                  {step.label}
                </div>
              ))}
            </div>

            {/* Credit cost */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium">Estimated cost</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs">
                  <Coins className="h-3 w-3" /> ~{estimatedCredits} credits
                </Badge>
                {!hasEnoughCredits && (
                  <span className="text-[10px] text-destructive">Not enough</span>
                )}
              </div>
            </div>

            {/* Launch */}
            <Button
              className="w-full gap-2"
              onClick={startCampaign}
              disabled={!hasEnoughCredits}
            >
              <Play className="h-4 w-4" />
              Launch Campaign
            </Button>
          </div>
        )}

        {phase === "running" && (
          <div className="space-y-4">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Step {currentStep + 1} of {steps.length}
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

            {/* Steps list */}
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {stepsState.map((step, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                      step.status === "running" && "border-primary/30 bg-primary/5",
                      step.status === "done" && "border-border bg-card",
                      step.status === "pending" && "border-border/50 bg-card/50",
                      step.status === "failed" && "border-destructive/30 bg-destructive/5"
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
                        <p className="text-xs text-muted-foreground mt-0.5">{step.output_summary}</p>
                      )}
                      {step.error && (
                        <p className="text-xs text-destructive mt-0.5">{step.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <p className="text-xs text-center text-muted-foreground">
              Running… don't close this dialog.
            </p>
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
                <Coins className="h-3 w-3" /> {estimatedCredits} credits used
              </Badge>
            </div>
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
