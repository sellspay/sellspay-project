import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Check, Zap, Plus, Minus, Diamond, LinkIcon, Sparkles, X } from "lucide-react";
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
    accentClass: "text-zinc-400",
    topBorder: "from-zinc-500 to-zinc-600",
    credits: "0 credits / month",
    addOns: false,
    isPopular: false,
    btnClass: "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700",
    creditPillBg: "bg-zinc-800/60 border-zinc-700",
    creditPillText: "text-zinc-300",
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
    accentClass: "text-cyan-400",
    topBorder: "from-cyan-400 to-blue-500",
    credits: "500 credits / month",
    addOns: false,
    isPopular: false,
    btnClass: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-transparent hover:opacity-90 shadow-lg shadow-cyan-500/20",
    creditPillBg: "bg-cyan-950/50 border-cyan-800/40",
    creditPillText: "text-cyan-300",
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
    accentClass: "text-fuchsia-400",
    topBorder: "from-fuchsia-500 to-violet-500",
    credits: "2,500 credits / month",
    addOns: true,
    isPopular: true,
    btnClass: "bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white border-transparent hover:opacity-90 shadow-lg shadow-fuchsia-500/20",
    creditPillBg: "bg-fuchsia-950/50 border-fuchsia-700/40",
    creditPillText: "text-fuchsia-300",
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
    accentClass: "text-amber-400",
    topBorder: "from-amber-400 to-orange-500",
    credits: "6,000 credits / month",
    addOns: true,
    isPopular: false,
    btnClass: "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent hover:opacity-90 shadow-lg shadow-amber-500/20",
    creditPillBg: "bg-amber-950/50 border-amber-700/40",
    creditPillText: "text-amber-300",
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

/* ─────────────── Light mode card config ─────────────── */
const LIGHT_OVERRIDES: Record<string, { creditPillBg: string; creditPillText: string; btnClass: string }> = {
  starter: {
    creditPillBg: "bg-zinc-100 border-zinc-200",
    creditPillText: "text-zinc-700",
    btnClass: "bg-background text-foreground border border-border hover:bg-muted",
  },
  basic: {
    creditPillBg: "bg-blue-50 border-blue-200",
    creditPillText: "text-blue-700",
    btnClass: "bg-background text-foreground border border-border hover:bg-muted",
  },
  creator: {
    creditPillBg: "bg-fuchsia-50 border-fuchsia-200",
    creditPillText: "text-fuchsia-700",
    btnClass: "bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white border-transparent hover:opacity-90 shadow-md",
  },
  agency: {
    creditPillBg: "bg-amber-50 border-amber-200",
    creditPillText: "text-amber-700",
    btnClass: "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent hover:opacity-90 shadow-md",
  },
};

/* ─────────────── Component ─────────────── */

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  darkMode?: boolean;
}

export function PricingModal({ open, onOpenChange, darkMode = false }: PricingModalProps) {
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

  // Theme tokens
  const bg = darkMode ? "bg-[#0e0e10]" : "bg-background";
  const headerBg = darkMode ? "bg-[#0e0e10]/95" : "bg-background/95";
  const textPrimary = darkMode ? "text-white" : "text-foreground";
  const textSecondary = darkMode ? "text-zinc-400" : "text-muted-foreground";
  const textTertiary = darkMode ? "text-zinc-500" : "text-muted-foreground/30";
  const borderBase = darkMode ? "border-zinc-800" : "border-border";
  const borderFaint = darkMode ? "border-zinc-800/50" : "border-border/30";
  const cardBg = darkMode ? "bg-zinc-900/50" : "bg-card";
  const mutedBg = darkMode ? "bg-zinc-800" : "bg-muted";
  const toggleActive = darkMode ? "bg-zinc-700 text-white shadow-sm" : "bg-background text-foreground shadow-sm";
  const toggleInactive = darkMode ? "text-zinc-400 hover:text-zinc-200" : "text-muted-foreground hover:text-foreground";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-[1400px] w-[98vw] p-0 rounded-2xl overflow-hidden max-h-[95vh] flex flex-col border-0",
        bg,
        darkMode
          ? "border border-zinc-800 shadow-[0_0_80px_-20px_rgba(6,182,212,0.15)]"
          : "border-border shadow-2xl"
      )}>
        
        {/* Scrollable content */}
        <div className={cn("overflow-y-auto flex-1", darkMode ? "dark-scrollbar" : "custom-scrollbar")}>
          {/* Header */}
          <div className={cn("text-center pt-12 pb-6 px-8 sticky top-0 backdrop-blur-xl z-20", headerBg)}>
            <h2 className={cn("text-4xl font-extrabold tracking-tight", textPrimary)}>
              Choose Your Plan
            </h2>
            <p className={cn("mt-3 text-base max-w-lg mx-auto", textSecondary)}>
              Scale your creative business with AI-powered tools.
            </p>

            {/* Billing Toggle */}
            <div className="flex justify-center mt-6">
              <div className={cn("inline-flex items-center rounded-full p-1 border", mutedBg, borderBase)}>
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={cn(
                    "px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200",
                    billingPeriod === "monthly" ? toggleActive : toggleInactive
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("annually")}
                  className={cn(
                    "px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                    billingPeriod === "annually" ? toggleActive : toggleInactive
                  )}
                >
                  Annually
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    darkMode ? "text-emerald-400 bg-emerald-500/15" : "text-green-600 bg-green-100"
                  )}>
                    UP TO 50% OFF
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ─── Plan Cards ─── */}
          <div className="px-8 pb-10">
            <div className="grid grid-cols-4 gap-5 max-w-[1300px] mx-auto items-stretch">
              {PLAN_CARDS.map((plan) => {
                const price = billingPeriod === "annually" ? plan.yearlyPrice : plan.monthlyPrice;
                const originalPrice = billingPeriod === "annually" && plan.monthlyPrice > 0 ? plan.monthlyPrice : null;
                const light = !darkMode ? LIGHT_OVERRIDES[plan.id] : null;
                const pillBg = light?.creditPillBg ?? plan.creditPillBg;
                const pillText = light?.creditPillText ?? plan.creditPillText;
                const btnCls = light?.btnClass ?? plan.btnClass;

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative rounded-2xl transition-all duration-300 flex flex-col",
                      darkMode
                        ? cn(
                            "bg-gradient-to-b from-[#1e1e24] via-[#18181c] to-[#111114]",
                            "border border-zinc-700/50",
                            "shadow-[0_8px_32px_-4px_rgba(0,0,0,0.7),0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-1px_0_rgba(0,0,0,0.3)]",
                            "hover:shadow-[0_12px_40px_-4px_rgba(0,0,0,0.8),0_4px_8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.3)]",
                            "hover:translate-y-[-3px]"
                          )
                        : "bg-card border overflow-hidden",
                      plan.isPopular
                        ? darkMode
                          ? "!border-fuchsia-500/60 !shadow-[0_8px_40px_-4px_rgba(192,38,211,0.35),0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-1px_0_rgba(0,0,0,0.3)]"
                          : "border-fuchsia-300 shadow-[0_0_40px_-8px_rgba(192,38,211,0.2)]"
                        : plan.id === "agency"
                          ? darkMode
                            ? "!border-amber-500/60 !shadow-[0_8px_40px_-4px_rgba(245,158,11,0.3),0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-1px_0_rgba(0,0,0,0.3)]"
                            : "border-amber-300 shadow-[0_0_40px_-8px_rgba(245,158,11,0.15)]"
                          : plan.id === "basic"
                            ? darkMode
                              ? "!border-cyan-500/40 !shadow-[0_8px_32px_-4px_rgba(6,182,212,0.2),0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-1px_0_rgba(0,0,0,0.3)]"
                              : "border-border hover:shadow-lg"
                            : darkMode
                              ? ""
                              : "border-border hover:shadow-lg"
                    )}
                    style={darkMode ? { transform: 'perspective(800px) rotateX(0deg)' } : undefined}
                  >
                    {/* Top gradient strip */}
                    <div className={cn("h-1.5 w-full bg-gradient-to-r rounded-t-2xl", plan.topBorder)} />

                    {/* Card header */}
                    <div className="p-6 pb-0">
                      <div className="flex items-start justify-between">
                        <h3 className={cn("text-xl font-bold", textPrimary)}>{plan.name}</h3>
                        {plan.badge && (
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white",
                            plan.badgeColor
                          )}>
                            {plan.badge}
                          </span>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-1.5 mt-4">
                        {originalPrice !== null && (
                          <span className={cn("text-sm line-through", textSecondary)}>${originalPrice}</span>
                        )}
                        <span className={cn("text-4xl font-extrabold", textPrimary)}>${price}</span>
                        <span className={cn("text-sm", textSecondary)}>/mo</span>
                      </div>

                      {/* CTA Button */}
                      <button
                        onClick={() => handleGetStarted(plan.id)}
                        className={cn(
                          "mt-5 w-full py-3 rounded-xl text-sm font-bold transition-all",
                          btnCls
                        )}
                      >
                        Get Started
                      </button>

                      <p className={cn("text-xs mt-4 leading-relaxed", textSecondary)}>{plan.tagline}</p>
                    </div>

                    {/* Credits banner */}
                    <div className={cn("mx-5 mt-4 px-4 py-3 rounded-xl border", pillBg)}>
                      <div className="flex items-center gap-2">
                        <Diamond className={cn("h-4 w-4", plan.accentClass)} />
                        <span className={cn("text-sm font-bold", pillText)}>
                          {plan.credits}
                        </span>
                      </div>
                      {plan.addOns && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <LinkIcon className={cn("h-3 w-3", plan.accentClass)} />
                          <span className={cn("text-[11px] font-semibold", pillText)}>
                            Add credits as needed
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Feature checklist */}
                    <div className="p-5 pt-4 flex-1">
                      <ul className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <Check className={cn("h-4 w-4 shrink-0 mt-0.5", plan.accentClass)} />
                            <span className={cn("text-sm leading-relaxed", textSecondary)}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Feature Comparison Table ─── */}
          <div className="px-8 pb-10">
            <div className="max-w-[1300px] mx-auto overflow-x-auto">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr>
                    <th className="w-[220px]" />
                    {PLAN_CARDS.map((p) => (
                      <th key={p.id} className="text-center px-4 pb-4 min-w-[160px]">
                        <span className={cn("text-sm font-bold", textPrimary)}>{p.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="pt-6 pb-4 px-1">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-cyan-400" />
                        <span className={cn("text-sm font-bold", textPrimary)}>Credits Usage</span>
                      </div>
                    </td>
                  </tr>
                  {([
                    { label: "Credits", values: ["0", "500/mo", "2,500/mo", "6,000/mo"] },
                    { label: "Add-on Credit Packs", values: [false, false, true, true] },
                    { label: "Number of Images", values: ["0", "~250/mo", "~1,250/mo", "~3,000/mo"] },
                    { label: "Number of Videos", values: ["0", "0", "~125/mo", "~300/mo"] },
                    { label: "AI Code Iterations", values: ["0", "~166/mo", "~833/mo", "~2,000/mo"] },
                    { label: "Parallel Generations", values: ["1", "4", "8", "16"] },
                    { label: "Transaction Fee", values: ["10%", "8%", "5%", "0%"] },
                  ] as { label: string; values: (string | boolean)[] }[]).map((row, i) => (
                    <tr key={`cu-${i}`} className={cn("border-t", borderFaint)}>
                      <td className={cn("py-3.5 px-1 text-sm", textSecondary)}>{row.label}</td>
                      {row.values.map((val, j) => (
                        <td key={j} className="py-3.5 px-4 text-center">
                          {val === true ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : val === false ? <span className={textTertiary}>—</span> : <span className={cn("text-sm font-medium", textPrimary)}>{val}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}

                  <tr>
                    <td colSpan={5} className="pt-12 pb-4 px-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-cyan-400" />
                        <span className={cn("text-sm font-bold", textPrimary)}>Features</span>
                      </div>
                    </td>
                  </tr>
                  {([
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
                  ] as { label: string; values: (string | boolean)[] }[]).map((row, i) => (
                    <tr key={`ft-${i}`} className={cn("border-t", borderFaint)}>
                      <td className={cn("py-3.5 px-1 text-sm", textSecondary)}>{row.label}</td>
                      {row.values.map((val, j) => (
                        <td key={j} className="py-3.5 px-4 text-center">
                          {val === true ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : val === false ? <span className={textTertiary}>—</span> : <span className={cn("text-sm font-medium", textPrimary)}>{val}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── FAQ Section ─── */}
          <div className="px-8 pb-12">
            <div className="max-w-[1000px] mx-auto">
              <div className="flex items-start gap-10">
                <h3 className={cn("text-2xl font-bold shrink-0 pt-3", textPrimary)}>FAQs</h3>
                <div className={cn("flex-1 divide-y", darkMode ? "divide-zinc-800" : "divide-border/50")}>
                  {FAQS.map((faq, idx) => (
                    <div key={idx}>
                      <button
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        className="w-full flex items-center justify-between py-5 text-left group"
                      >
                        <span className={cn(
                          "text-sm font-medium transition-colors",
                          textPrimary,
                          "group-hover:text-cyan-400"
                        )}>
                          {faq.q}
                        </span>
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 ml-4 transition-colors",
                          openFaq === idx
                            ? darkMode ? "bg-cyan-500 text-white" : "bg-primary text-primary-foreground"
                            : darkMode ? "bg-zinc-800 text-zinc-400" : "bg-primary/10 text-primary"
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
                            <p className={cn("pb-5 text-sm leading-relaxed pr-10", textSecondary)}>
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
