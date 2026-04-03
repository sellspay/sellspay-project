import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Check, X, Zap, Crown, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 0,
    yearlyPrice: 0,
    tagline: "Start experimenting with digital selling.",
    badge: null,
    topBorder: "from-zinc-300 to-zinc-400",
    features: [
      { text: "Create & Customize Storefront", included: true },
      { text: "Sell Digital Products & Subs", included: true },
      { text: "Buy from Marketplace", included: true },
      { text: "Community Access", included: true },
      { text: "Basic Analytics", included: true },
      { text: "VibeCoder AI Builder", included: false },
      { text: "AI Image Generation", included: false },
      { text: "AI Video Generation", included: false },
      { text: "Pro Models (GPT-5, Gemini)", included: false },
      { text: "Priority Support", included: false },
    ],
    credits: 0,
    feeLabel: "10% Transaction Fee",
  },
  {
    id: "basic",
    name: "Basic",
    monthlyPrice: 25,
    yearlyPrice: 15,
    tagline: "Unlock AI-powered building tools.",
    badge: null,
    topBorder: "from-blue-400 to-cyan-400",
    features: [
      { text: "Everything in Starter", included: true },
      { text: "VibeCoder (Flash Models)", included: true, highlight: true },
      { text: "500 Monthly AI Credits", included: true, highlight: true },
      { text: "Manual Model Selection", included: true },
      { text: "AI Storefront Editor", included: true },
      { text: "Audio Tools (Free Tier)", included: true },
      { text: "Pro Models (GPT-5, Gemini Pro)", included: false },
      { text: "AI Image Generation", included: false },
      { text: "AI Video Generation", included: false },
      { text: "Priority Support", included: false },
    ],
    credits: 500,
    feeLabel: "8% Transaction Fee",
  },
  {
    id: "creator",
    name: "Creator",
    monthlyPrice: 100,
    yearlyPrice: 56,
    tagline: "Full AI suite for serious creators.",
    badge: "MOST POPULAR",
    badgeColor: "bg-gradient-to-r from-fuchsia-500 to-violet-500",
    topBorder: "from-fuchsia-500 to-violet-500",
    isPopular: true,
    features: [
      { text: "Everything in Basic", included: true },
      { text: "Pro Models (GPT-5, Gemini 3 Pro)", included: true, highlight: true },
      { text: "AI Image Generation", included: true, highlight: true },
      { text: "2,500 Monthly AI Credits", included: true, highlight: true },
      { text: "Auto-Model Selection", included: true },
      { text: "All Audio Tools (Pro Tier)", included: true },
      { text: "Grey Verified Badge", included: true },
      { text: "Advanced Analytics", included: true },
      { text: "Commercial Use Rights", included: true },
      { text: "AI Video Generation", included: false },
    ],
    credits: 2500,
    feeLabel: "5% Transaction Fee",
  },
  {
    id: "agency",
    name: "Agency",
    monthlyPrice: 200,
    yearlyPrice: 120,
    tagline: "Unlimited power for studios & teams.",
    badge: "BEST VALUE",
    badgeColor: "bg-gradient-to-r from-amber-500 to-orange-500",
    topBorder: "from-amber-400 to-orange-500",
    features: [
      { text: "Everything in Creator", included: true },
      { text: "Flagship Models (GPT-5.2)", included: true, highlight: true },
      { text: "AI Video Generation", included: true, highlight: true },
      { text: "6,000 Monthly AI Credits", included: true, highlight: true },
      { text: "Full Auto-Model Access", included: true },
      { text: "Priority Processing Queue", included: true },
      { text: "Gold Verified Badge", included: true },
      { text: "Unlimited AI Storefronts", included: true },
      { text: "Priority Support", included: true },
      { text: "0% Transaction Fees", included: true, highlight: true },
    ],
    credits: 6000,
    feeLabel: "0% Transaction Fee",
  },
];

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PricingModal({ open, onOpenChange }: PricingModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annually">("annually");
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = (planId: string) => {
    onOpenChange(false);
    if (!user) {
      navigate("/signup");
    } else {
      navigate("/billing");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] w-[96vw] p-0 bg-background border-border rounded-2xl overflow-hidden max-h-[92vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="text-center pt-10 pb-4 px-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            Choose Your Plan
          </h2>
          <p className="text-muted-foreground mt-2 text-base max-w-lg mx-auto">
            Scale your creative business with AI-powered tools, from free to enterprise.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center pb-6">
          <div className="inline-flex items-center bg-muted rounded-full p-1 border border-border">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200",
                billingPeriod === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annually")}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                billingPeriod === "annually"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Annually
              <span className="text-[11px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                UP TO 50% OFF
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 px-6 pb-10">
          {PLANS.map((plan, index) => {
            const price = billingPeriod === "annually" ? plan.yearlyPrice : plan.monthlyPrice;
            const originalPrice = billingPeriod === "annually" && plan.monthlyPrice > 0 ? plan.monthlyPrice : null;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                className={cn(
                  "relative flex flex-col rounded-xl border overflow-hidden",
                  "bg-card",
                  plan.isPopular
                    ? "border-fuchsia-500 shadow-lg shadow-fuchsia-500/10 scale-[1.02]"
                    : "border-border"
                )}
              >
                {/* Top accent bar */}
                <div className={cn("h-1 w-full bg-gradient-to-r", plan.topBorder)} />

                <div className="p-6 flex flex-col flex-1">
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    {plan.badge && (
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white",
                        plan.badgeColor
                      )}>
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-1">
                    <div className="flex items-baseline gap-1.5">
                      {originalPrice !== null && (
                        <span className="text-base text-muted-foreground line-through font-medium">${originalPrice}</span>
                      )}
                      <span className="text-5xl font-extrabold tracking-tight text-foreground">${price}</span>
                      <span className="text-sm text-muted-foreground font-medium">/mo</span>
                    </div>
                  </div>

                  {/* Tagline */}
                  <p className="text-sm text-muted-foreground mb-5">{plan.tagline}</p>

                  {/* CTA */}
                  <button
                    onClick={() => handleGetStarted(plan.id)}
                    className={cn(
                      "w-full py-3 rounded-xl text-sm font-bold transition-all duration-200",
                      plan.isPopular
                        ? "bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white hover:opacity-90 shadow-md shadow-fuchsia-500/20"
                        : "bg-foreground text-background hover:opacity-90"
                    )}
                  >
                    Get Started
                  </button>

                  {/* Credits */}
                  {plan.credits > 0 && (
                    <div className="mt-5 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/10">
                      <Zap className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-bold text-primary">
                        {plan.credits.toLocaleString()} credits / month
                      </span>
                    </div>
                  )}

                  {/* Fee */}
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={cn(
                      "font-semibold",
                      plan.feeLabel.includes("0%") && "text-green-600"
                    )}>
                      {plan.feeLabel}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-border my-5" />

                  {/* Features */}
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        {feature.included ? (
                          <Check className={cn(
                            "h-4 w-4 shrink-0 mt-0.5",
                            feature.highlight ? "text-primary" : "text-green-500"
                          )} />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-0.5" />
                        )}
                        <span className={cn(
                          "text-[13px] leading-snug",
                          feature.included
                            ? feature.highlight
                              ? "text-foreground font-semibold"
                              : "text-foreground/80"
                            : "text-muted-foreground/50"
                        )}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
