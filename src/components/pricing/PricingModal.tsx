import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Check, X, Sparkles, Crown, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Build your store manually. No AI features.",
    badge: null,
    borderColor: "border-zinc-700/50",
    accentColor: "text-zinc-400",
    creditColor: "text-zinc-400",
    features: [
      "Create & Customize Storefront",
      "Sell Digital Products & Subs",
      "Buy from Marketplace",
      "Community Access",
    ],
    credits: 0,
  },
  {
    id: "basic",
    name: "Basic",
    monthlyPrice: 25,
    yearlyPrice: 15,
    description: "Get started with AI-powered building.",
    badge: null,
    borderColor: "border-blue-500/50",
    accentColor: "text-blue-400",
    creditColor: "text-blue-400",
    features: [
      "Everything in Starter",
      "VibeCoder (Flash Models)",
      "500 Monthly Credits",
      "Manual Model Selection",
    ],
    credits: 500,
  },
  {
    id: "creator",
    name: "Creator",
    monthlyPrice: 100,
    yearlyPrice: 56,
    description: "Full AI suite for serious creators.",
    badge: "MOST POPULAR",
    badgeColor: "bg-fuchsia-500",
    borderColor: "border-fuchsia-500",
    accentColor: "text-fuchsia-400",
    creditColor: "text-green-400",
    features: [
      "Everything in Basic",
      "Pro Models (GPT-5, Gemini 3 Pro)",
      "AI Image Generation",
      "Auto-Model Selection",
      "2,500 Monthly Credits",
      "Grey Verified Badge",
    ],
    credits: 2500,
  },
  {
    id: "agency",
    name: "Agency",
    monthlyPrice: 200,
    yearlyPrice: 120,
    description: "Maximum power for studios and agencies.",
    badge: "BEST VALUE",
    badgeColor: "bg-green-500",
    borderColor: "border-amber-500/50",
    accentColor: "text-amber-400",
    creditColor: "text-green-400",
    features: [
      "Everything in Creator",
      "Flagship Models (GPT-5.2)",
      "AI Video Generation",
      "Full Auto-Model Access",
      "6,000 Monthly Credits",
      "Priority Processing",
      "Gold Verified Badge",
      "0% Transaction Fees",
    ],
    credits: 6000,
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
      <DialogContent className="max-w-[1100px] w-[95vw] p-0 bg-[#0a0f1a] border-white/10 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Billing Toggle */}
        <div className="flex justify-center pt-8 pb-2">
          <div className="inline-flex items-center bg-[#141b2d] rounded-full p-1 border border-white/10">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-all duration-200",
                billingPeriod === "monthly"
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              MONTHLY
            </button>
            <button
              onClick={() => setBillingPeriod("annually")}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2",
                billingPeriod === "annually"
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              ANNUALLY
              <span className="text-green-400 text-xs font-bold">UP TO 50% OFF</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-4 gap-4 px-6 pb-8 pt-4">
          {PLANS.map((plan) => {
            const price = billingPeriod === "annually" ? plan.yearlyPrice : plan.monthlyPrice;
            const originalPrice = billingPeriod === "annually" ? plan.monthlyPrice : null;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "relative flex flex-col rounded-xl border p-5",
                  "bg-[#0d1323]",
                  plan.borderColor
                )}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-0 left-0 right-0 flex justify-center">
                    <span className={cn(
                      "px-3 py-0.5 rounded-b-lg text-[10px] font-bold uppercase tracking-wider text-white",
                      plan.badgeColor
                    )}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="text-lg font-bold text-white mt-2">{plan.name}</h3>

                {/* Price */}
                <div className="flex items-baseline gap-1.5 mt-3 mb-1">
                  {originalPrice !== null && originalPrice > 0 && (
                    <span className="text-sm text-zinc-600 line-through">${originalPrice}</span>
                  )}
                  <span className="text-4xl font-extrabold text-white tracking-tight">${price}</span>
                  <span className="text-sm text-zinc-500">/Seat/mo</span>
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleGetStarted(plan.id)}
                  className={cn(
                    "w-full py-2.5 rounded-lg text-sm font-semibold mt-3 transition-all duration-200",
                    "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                  )}
                >
                  Get Started
                </button>

                {/* Description */}
                <p className="text-xs text-zinc-500 mt-3">{plan.description}</p>

                {/* Credits Badge */}
                {plan.credits > 0 && (
                  <div className="mt-4 space-y-1">
                    <div className={cn("flex items-center gap-1.5 text-xs font-semibold", plan.creditColor)}>
                      <Zap className="h-3.5 w-3.5" />
                      {plan.credits.toLocaleString()} credits / month
                    </div>
                  </div>
                )}

                {/* Features */}
                <ul className="mt-4 space-y-2.5 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-zinc-400 leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
