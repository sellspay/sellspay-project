import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/hooks/useSubscription";
import MainLayout from "@/components/layout/MainLayout";
import { Check, Crown, Loader2, Zap, ExternalLink, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { CreditTopUpDialog } from "@/components/ai-builder/CreditTopUpDialog";
import { useState } from "react";

const PLAN_META: Record<string, { label: string; color: string; credits: number }> = {
  browser: { label: "Free", color: "text-zinc-400", credits: 0 },
  starter: { label: "Starter", color: "text-zinc-400", credits: 0 },
  basic: { label: "Basic", color: "text-emerald-400", credits: 500 },
  creator: { label: "Creator", color: "text-violet-400", credits: 2500 },
  agency: { label: "Agency", color: "text-amber-400", credits: 6000 },
};

export default function Billing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    plan, credits, capabilities, sellerFee, badge, expiresAt,
    loading, openCustomerPortal, startCheckout, isPremium,
  } = useSubscription();
  const [topUpOpen, setTopUpOpen] = useState(false);

  const meta = PLAN_META[plan] || PLAN_META.browser;
  const maxCredits = meta.credits || Math.max(credits, 100);
  const creditPercent = Math.min(100, (credits / maxCredits) * 100);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Plans & Credits</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your subscription plan and credit balance.
            </p>
          </div>

          {/* Current Plan + Credits Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

            {/* Current Plan Card */}
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {plan === "agency" ? (
                    <Crown size={20} className="text-amber-400" />
                  ) : (
                    <Zap size={20} className="text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-bold">
                    You're on the{" "}
                    <span className={meta.color}>{meta.label}</span> Plan
                  </p>
                  {expiresAt && (
                    <p className="text-xs text-muted-foreground">
                      Renews {new Date(expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => isPremium ? openCustomerPortal() : navigate("/pricing")}
                className="mt-auto text-sm font-medium text-foreground bg-muted hover:bg-muted/80 px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 w-fit"
              >
                {isPremium ? "Manage Subscription" : "View Plans"}
                <ExternalLink size={14} />
              </button>
            </div>

            {/* Credits Remaining Card */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-muted-foreground">Credits remaining</span>
                <span className="text-sm font-bold tabular-nums">
                  {credits.toLocaleString()}
                  {meta.credits > 0 && (
                    <span className="text-muted-foreground font-normal"> of {meta.credits.toLocaleString()}</span>
                  )}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden mt-3 mb-4">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    plan === "agency" ? "bg-amber-500" : "bg-primary"
                  )}
                  style={{ width: `${creditPercent}%` }}
                />
              </div>

              <div className="space-y-1.5 mb-4">
                {meta.credits > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check size={14} className="text-green-400 shrink-0" />
                    <span>{meta.credits.toLocaleString()} credits reset monthly</span>
                  </div>
                )}
                {isPremium && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check size={14} className="text-green-400 shrink-0" />
                    <span>Using {meta.label} monthly credits</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setTopUpOpen(true)}
                className="text-sm font-medium border border-border hover:bg-muted px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <CreditCard size={14} />
                Top up credits
              </button>
            </div>
          </div>

          {/* Capabilities Summary */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Your capabilities</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "VibeCoder AI", enabled: capabilities.vibecoder },
                { label: "Image Generation", enabled: capabilities.imageGen },
                { label: "Video Generation", enabled: capabilities.videoGen },
                { label: `${sellerFee}% Seller Fee`, enabled: true, isNeutral: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    item.isNeutral ? "bg-muted-foreground" : item.enabled ? "bg-green-400" : "bg-zinc-600"
                  )} />
                  <span className={cn(
                    "text-sm",
                    item.isNeutral ? "text-muted-foreground" : item.enabled ? "text-foreground" : "text-muted-foreground line-through"
                  )}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade CTA (only if not on agency) */}
          {plan !== "agency" && (
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground">Want more power?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Upgrade your plan to unlock more AI capabilities, higher credit limits, and lower fees.
                </p>
              </div>
              <button
                onClick={() => navigate("/pricing")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
              >
                View Plans
              </button>
            </div>
          )}
        </div>
      </div>

      <CreditTopUpDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        currentBalance={credits}
      />
    </MainLayout>
  );
}
