import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Check, Zap, Plus, Minus, Diamond, LinkIcon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

/* ─────────────── Per-card feature lists ─────────────── */
const PLAN_CARDS = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 0,
    yearlyPrice: 0,
    tagline: "Start experimenting with digital selling.",
    badge: null,
    badgeColor: "",
    accentColor: "text-zinc-500",
    borderColor: "border-zinc-200",
    creditsBg: "bg-zinc-100",
    creditsText: "text-zinc-700",
    creditsBorder: "border-zinc-200",
    topBorder: "from-zinc-300 to-zinc-400",
    credits: "0 credits / month",
    addOns: false,
    isPopular: false,
    features: [
      "Create & Customize Storefront",
      "Sell Digital Products & Subs",
      "Buy from Marketplace",
      "Community Access",
      "10% Transaction Fee",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    monthlyPrice: 25,
    yearlyPrice: 15,
    tagline: "Unlock AI-powered building tools.",
    badge: null,
    badgeColor: "",
    accentColor: "text-blue-500",
    borderColor: "border-blue-200",
    creditsBg: "bg-blue-50",
    creditsText: "text-blue-700",
    creditsBorder: "border-blue-200",
    topBorder: "from-blue-400 to-cyan-400",
    credits: "500 credits / month",
    addOns: false,
    isPopular: false,
    features: [
      "Up to ~250 images",
      "VibeCoder AI Builder",
      "Flash Models (Gemini Flash)",
      "All Audio Tools",
      "AI Storefront Editor",
      "4 parallel generations",
      "8% Transaction Fee",
    ],
  },
  {
    id: "creator",
    name: "Creator",
    monthlyPrice: 100,
    yearlyPrice: 56,
    tagline: "Full AI suite for serious creators.",
    badge: "MOST POPULAR",
    badgeColor: "bg-gradient-to-r from-fuchsia-500 to-violet-500",
    accentColor: "text-fuchsia-500",
    borderColor: "border-fuchsia-300",
    creditsBg: "bg-fuchsia-50",
    creditsText: "text-fuchsia-700",
    creditsBorder: "border-fuchsia-200",
    topBorder: "from-fuchsia-500 to-violet-500",
    credits: "2,500 credits / month",
    addOns: true,
    isPopular: true,
    features: [
      "Up to ~1,250 images",
      "Up to ~125 videos",
      "Pro Models (GPT-5, Gemini Pro)",
      "AI Image Generation",
      "Auto-Model Selection",
      "Advanced Analytics",
      "8 parallel generations",
      "Verified Badge (Grey)",
      "Commercial Use Rights",
      "5% Transaction Fee",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    monthlyPrice: 200,
    yearlyPrice: 120,
    tagline: "Unlimited power for studios & teams.",
    badge: "BEST VALUE",
    badgeColor: "bg-gradient-to-r from-amber-500 to-orange-500",
    accentColor: "text-amber-500",
    borderColor: "border-amber-300",
    creditsBg: "bg-amber-50",
    creditsText: "text-amber-700",
    creditsBorder: "border-amber-200",
    topBorder: "from-amber-400 to-orange-500",
    credits: "6,000 credits / month",
    addOns: true,
    isPopular: false,
    features: [
      "Up to ~3,000 images",
      "Up to ~300 videos",
      "Flagship Models (GPT-5.2)",
      "AI Video Generation",
      "16 parallel generations",
      "Verified Badge (Gold)",
      "Priority Processing",
      "Priority Support",
      "Commercial Use Rights",
      "0% Transaction Fee",
    ],
  },
];

/* ─────────────── FAQ data ─────────────── */
const FAQS = [
  { q: "Can I cancel my subscription any time?", a: "Yes. You can cancel anytime from your billing settings. Your credits remain active until the end of your billing cycle." },
  { q: "How do I cancel my subscription?", a: "Go to Settings → Billing → Manage Subscription. Click 'Cancel Subscription'. Your plan will remain active until the end of the current period." },
  { q: "Do my monthly credits roll over?", a: "Unused credits roll over for one billing cycle. After that, unspent credits expire. This encourages active usage while giving you flexibility." },
  { q: "What's the difference between monthly and annual plans?", a: "Annual plans save up to 50% compared to monthly billing. You pay once per year and get all the same features. Credits are still distributed monthly." },
  { q: "What are add-ons?", a: "Add-on Credit Packs let you purchase extra credits on top of your plan's monthly allocation. Available on Creator and Agency plans." },
  { q: "What happens when I upgrade?", a: "You'll immediately get access to the new plan's features and a pro-rated credit allocation. Any existing credits carry over." },
  { q: "What happens when I downgrade/cancel?", a: "Your current plan stays active until the end of the billing period. After that, you'll move to the lower plan. Your storefront remains live." },
  { q: "How does the 0% fee work?", a: "On the Agency plan, SellsPay takes $0 from your sales. You keep 100% of your revenue (minus standard Stripe processing fees of ~2.9% + 30¢)." },
];

/* ─────────────── Component ─────────────── */

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PricingModal({ open, onOpenChange }: PricingModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annually">("annually");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
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
      <DialogContent className="max-w-[1200px] w-[96vw] p-0 bg-background border-border rounded-2xl overflow-hidden max-h-[92vh] shadow-2xl flex flex-col">
        
        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {/* Header */}
          <div className="text-center pt-10 pb-4 px-6 sticky top-0 bg-background/95 backdrop-blur-sm z-20">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Choose Your Plan
            </h2>
            <p className="text-muted-foreground mt-2 text-base max-w-lg mx-auto">
              Scale your creative business with AI-powered tools.
            </p>

            {/* Billing Toggle */}
            <div className="flex justify-center mt-5">
              <div className="inline-flex items-center bg-muted rounded-full p-1 border border-border">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={cn(
                    "px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200",
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
                    "px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                    billingPeriod === "annually"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Annually
                  <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                    UP TO 50% OFF
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ─── Plan Cards ─── */}
          <div className="px-6 pb-8">
            <div className="grid grid-cols-4 gap-4 max-w-[1100px] mx-auto items-stretch">
              {PLAN_CARDS.map((plan) => {
                const price = billingPeriod === "annually" ? plan.yearlyPrice : plan.monthlyPrice;
                const originalPrice = billingPeriod === "annually" && plan.monthlyPrice > 0 ? plan.monthlyPrice : null;
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col",
                      plan.isPopular
                        ? "border-fuchsia-300 shadow-[0_0_40px_-8px_rgba(192,38,211,0.2)]"
                        : plan.id === "agency"
                          ? "border-amber-300 shadow-[0_0_40px_-8px_rgba(245,158,11,0.15)]"
                          : "border-border hover:shadow-lg"
                    )}
                  >
                    {/* Top gradient strip */}
                    <div className={cn("h-1.5 w-full bg-gradient-to-r", plan.topBorder)} />

                    {/* Card header */}
                    <div className="p-5 pb-0">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                        {plan.badge && (
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white",
                            plan.badgeColor
                          )}>
                            {plan.badge}
                          </span>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-1.5 mt-3">
                        {originalPrice !== null && (
                          <span className="text-sm text-muted-foreground line-through">${originalPrice}</span>
                        )}
                        <span className="text-3xl font-extrabold text-foreground">${price}</span>
                        <span className="text-xs text-muted-foreground">/mo</span>
                      </div>

                      {/* CTA Button */}
                      <button
                        onClick={() => handleGetStarted(plan.id)}
                        className={cn(
                          "mt-4 w-full py-2.5 rounded-lg text-sm font-bold transition-all border",
                          plan.isPopular
                            ? "bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white border-transparent hover:opacity-90 shadow-md"
                            : plan.id === "agency"
                              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent hover:opacity-90 shadow-md"
                              : "bg-background text-foreground border-border hover:bg-muted"
                        )}
                      >
                        Get Started
                      </button>

                      <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">{plan.tagline}</p>
                    </div>

                    {/* Credits banner */}
                    <div className={cn(
                      "mx-4 mt-4 px-3 py-2.5 rounded-xl border",
                      plan.creditsBg, plan.creditsBorder
                    )}>
                      <div className="flex items-center gap-2">
                        <Diamond className={cn("h-3.5 w-3.5", plan.accentColor)} />
                        <span className={cn("text-xs font-bold", plan.creditsText)}>
                          {plan.credits}
                        </span>
                      </div>
                      {plan.addOns && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <LinkIcon className={cn("h-3 w-3", plan.accentColor)} />
                          <span className={cn("text-[10px] font-semibold", plan.creditsText)}>
                            Add credits as needed
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Feature checklist */}
                    <div className="p-4 pt-3 flex-1">
                      <ul className="space-y-2.5">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <Check className={cn("h-4 w-4 shrink-0 mt-0.5", plan.accentColor)} />
                            <span className="text-xs text-muted-foreground leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── FAQ Section ─── */}
          <div className="px-6 pb-10">
            <div className="max-w-[900px] mx-auto">
              <div className="flex items-start gap-8">
                <h3 className="text-xl font-bold text-foreground shrink-0 pt-3">FAQs</h3>
                <div className="flex-1 divide-y divide-border/50">
                  {FAQS.map((faq, idx) => (
                    <div key={idx}>
                      <button
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        className="w-full flex items-center justify-between py-4 text-left group"
                      >
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {faq.q}
                        </span>
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-4 transition-colors",
                          openFaq === idx
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10 text-primary"
                        )}>
                          {openFaq === idx ? (
                            <Minus className="h-3.5 w-3.5" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                        </div>
                      </button>
                      <AnimatePresence>
                        {openFaq === idx && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <p className="pb-4 text-sm text-muted-foreground leading-relaxed pr-10">
                              {faq.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
