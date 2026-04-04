import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Check, X, Zap, Crown, Sparkles, Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

/* ─────────────── Plan data ─────────────── */
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 0,
    yearlyPrice: 0,
    tagline: "Start experimenting with digital selling.",
    badge: null,
    topBorder: "from-zinc-300 to-zinc-400",
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
    credits: 6000,
    feeLabel: "0% Transaction Fee",
  },
];

/* ─────────────── Credits Usage rows ─────────────── */
const CREDITS_USAGE = [
  { label: "Credits", values: ["0", "500/mo", "2,500/mo", "6,000/mo"] },
  { label: "Add-on Credit Packs", values: ["—", "—", true, true] },
  { label: "Number of Images", values: ["0", "~250/mo", "~1,250/mo", "~3,000/mo"] },
  { label: "Number of Videos", values: ["0", "0", "~125/mo", "~300/mo"] },
  { label: "AI Code Iterations", values: ["0", "~166/mo", "~833/mo", "~2,000/mo"] },
  { label: "Parallel Generations", values: ["1", "4", "8", "16"] },
  { label: "Transaction Fee", values: ["10%", "8%", "5%", "0%"] },
];

/* ─────────────── Features rows ─────────────── */
const FEATURES = [
  { label: "Create & Customize Storefront", values: [true, true, true, true] },
  { label: "Sell Digital Products & Subs", values: [true, true, true, true] },
  { label: "Buy from Marketplace", values: [true, true, true, true] },
  { label: "Community Access", values: [true, true, true, true] },
  { label: "VibeCoder AI Builder", values: [false, true, true, true] },
  { label: "Flash Models (Gemini Flash)", values: [false, true, true, true] },
  { label: "Pro Models (GPT-5, Gemini Pro)", values: [false, false, true, true] },
  { label: "Flagship Models (GPT-5.2)", values: [false, false, false, true] },
  { label: "AI Image Generation", values: [false, false, true, true] },
  { label: "AI Video Generation", values: [false, false, false, true] },
  { label: "All Audio Tools", values: [false, true, true, true] },
  { label: "Auto-Model Selection", values: [false, false, true, true] },
  { label: "AI Storefront Editor", values: [false, true, true, true] },
  { label: "Advanced Analytics", values: [false, false, true, true] },
  { label: "Verified Badge", values: [false, false, "Grey", "Gold"] },
  { label: "Priority Processing", values: [false, false, false, true] },
  { label: "Priority Support", values: [false, false, false, true] },
  { label: "Commercial Use Rights", values: [false, false, true, true] },
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

/* ─────────────── Cell renderer ─────────────── */
function CellValue({ value, planIndex }: { value: string | boolean; planIndex: number }) {
  if (value === true) return <Check className="h-4 w-4 text-emerald-500 mx-auto" />;
  if (value === false) return <span className="text-muted-foreground/30">—</span>;
  return <span className="text-sm text-foreground font-medium">{value}</span>;
}

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

          {/* ─── Comparison Table ─── */}
          <div className="px-6 pb-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[700px]">
                {/* Plan headers */}
                <thead>
                  <tr>
                    <th className="w-[200px]" />
                    {PLANS.map((plan) => {
                      const price = billingPeriod === "annually" ? plan.yearlyPrice : plan.monthlyPrice;
                      const originalPrice = billingPeriod === "annually" && plan.monthlyPrice > 0 ? plan.monthlyPrice : null;
                      return (
                        <th key={plan.id} className="text-center px-3 pb-4 pt-2 align-bottom min-w-[160px]">
                          {plan.badge && (
                            <span className={cn(
                              "inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white mb-2",
                              plan.badgeColor || "bg-muted"
                            )}>
                              {plan.badge}
                            </span>
                          )}
                          <div className="text-lg font-bold text-foreground">{plan.name}</div>
                          <div className="flex items-baseline justify-center gap-1 mt-1">
                            {originalPrice !== null && (
                              <span className="text-xs text-muted-foreground line-through">${originalPrice}</span>
                            )}
                            <span className="text-2xl font-extrabold text-foreground">${price}</span>
                            <span className="text-xs text-muted-foreground">/mo</span>
                          </div>
                          <button
                            onClick={() => handleGetStarted(plan.id)}
                            className={cn(
                              "mt-3 w-full py-2 rounded-full text-xs font-bold transition-all",
                              plan.isPopular
                                ? "bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white hover:opacity-90"
                                : "bg-foreground text-background hover:opacity-90"
                            )}
                          >
                            Get Started
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {/* Credits Usage section */}
                  <tr>
                    <td colSpan={5} className="pt-8 pb-3 px-1">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold text-foreground">Credits Usage</span>
                      </div>
                    </td>
                  </tr>
                  {CREDITS_USAGE.map((row, i) => (
                    <tr key={`cu-${i}`} className="border-t border-border/30">
                      <td className="py-3 px-1 text-sm text-muted-foreground">{row.label}</td>
                      {row.values.map((val, j) => (
                        <td key={j} className="py-3 px-3 text-center">
                          <CellValue value={val} planIndex={j} />
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Features section */}
                  <tr>
                    <td colSpan={5} className="pt-10 pb-3 px-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold text-foreground">Features</span>
                      </div>
                    </td>
                  </tr>
                  {FEATURES.map((row, i) => (
                    <tr key={`ft-${i}`} className="border-t border-border/30">
                      <td className="py-3 px-1 text-sm text-muted-foreground">{row.label}</td>
                      {row.values.map((val, j) => (
                        <td key={j} className="py-3 px-3 text-center">
                          <CellValue value={val} planIndex={j} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
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
