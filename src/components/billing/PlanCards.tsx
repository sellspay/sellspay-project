import { useState } from "react";
import { Check, X, Info, Loader2, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLANS, type PlanData } from "@/data/plans";

interface PlanCardsProps {
  currentPlan: string;
  onSubscribe: (tierId: 'basic' | 'creator' | 'agency') => Promise<void>;
  onManage: () => void;
}

function FeatureRow({ feature }: { feature: PlanData['features'][number] }) {
  const isNegative = feature.included === false;
  const isNeutral = feature.isNeutral;

  return (
    <div className={cn("flex items-start gap-2.5 text-sm", isNegative && "opacity-40")}>
      {isNegative ? (
        <X size={14} className="text-zinc-500 mt-0.5 shrink-0" />
      ) : isNeutral ? (
        <Info size={14} className="text-zinc-500 mt-0.5 shrink-0" />
      ) : (
        <Check size={14} className={cn(
          "mt-0.5 shrink-0",
          feature.highlightColor || (feature.highlight ? "text-primary" : "text-green-400")
        )} />
      )}
      <span className={cn(
        "text-sm",
        feature.highlight ? "text-foreground font-medium" : isNegative ? "text-muted-foreground" : "text-muted-foreground"
      )}>
        {feature.text}
      </span>
    </div>
  );
}

export function PlanCards({ currentPlan, onSubscribe, onManage }: PlanCardsProps) {
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const isCurrentPlan = (id: string) => currentPlan === id || (currentPlan === 'browser' && id === 'starter');

  const handleSubscribe = async (tierId: 'basic' | 'creator' | 'agency') => {
    setPurchasing(tierId);
    try {
      await onSubscribe(tierId);
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {PLANS.map((planData) => {
        const isCurrent = isCurrentPlan(planData.id);
        const isCreator = planData.id === 'creator';
        const isAgency = planData.id === 'agency';
        const isPurchasing = purchasing === planData.id;

        return (
          <div
            key={planData.id}
            className={cn(
              "relative flex flex-col p-5 rounded-2xl border transition-all",
              isCurrent
                ? "border-primary/30 bg-primary/5"
                : isCreator
                  ? "border-zinc-700 bg-card hover:border-primary/30"
                  : "border-border bg-card hover:border-zinc-600"
            )}
          >
            {/* Accent bar */}
            <div className={cn("absolute top-0 inset-x-0 h-0.5 rounded-t-2xl bg-gradient-to-r", planData.accentGradient)} />

            {/* Header */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                  {planData.name}
                  {isAgency && <Crown size={14} className="text-amber-400" />}
                </h3>
                {isCurrent && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                    Current
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{planData.description}</p>
            </div>

            {/* Price */}
            <div className="mb-4">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-foreground">${planData.price}</span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
              {planData.credits > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {planData.credits.toLocaleString()} credits/month
                </p>
              )}
            </div>

            {/* Features */}
            <div className="space-y-2.5 mb-5 flex-1">
              {planData.features.map((feature, idx) => (
                <FeatureRow key={idx} feature={feature} />
              ))}
            </div>

            {/* Button */}
            {isCurrent ? (
              <button
                onClick={onManage}
                className="w-full py-2 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                Manage
              </button>
            ) : planData.id === 'starter' ? (
              <div className="w-full py-2 rounded-xl text-sm font-medium text-center text-muted-foreground">
                Free forever
              </div>
            ) : (
              <button
                onClick={() => handleSubscribe(planData.id as 'basic' | 'creator' | 'agency')}
                disabled={isPurchasing}
                className={cn(
                  "w-full py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                  isAgency
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 text-white"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
              >
                {isPurchasing && <Loader2 className="h-4 w-4 animate-spin" />}
                {isPurchasing ? "Processing..." : isAgency ? "Go Elite" : "Subscribe"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
