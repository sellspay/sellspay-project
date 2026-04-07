import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Check, Zap, Plus, Minus, Diamond, LinkIcon, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

/* ─────────────── Plan data ─────────────── */
const PLAN_CARDS = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 0,
    yearlyPrice: 0,
    tagline: "Start experimenting with digital selling.",
    badge: null,
    badgeColor: "",
    accent: "zinc",
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
    accent: "cyan",
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
    accent: "fuchsia",
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
    accent: "amber",
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

const ACCENT_STYLES: Record<string, {
  border: string; glow: string; check: string; btn: string;
  pillBg: string; pillText: string; pillIcon: string; topBar: string;
}> = {
  zinc: {
    border: "border-white/[0.08]",
    glow: "",
    check: "text-zinc-400",
    btn: "bg-white/[0.06] hover:bg-white/[0.1] text-white/80 border border-white/[0.1]",
    pillBg: "bg-white/[0.04] border-white/[0.08]",
    pillText: "text-zinc-300",
    pillIcon: "text-zinc-400",
    topBar: "from-zinc-600 to-zinc-500",
  },
  cyan: {
    border: "border-cyan-500/20",
    glow: "",
    check: "text-cyan-400",
    btn: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:brightness-110",
    pillBg: "bg-cyan-500/[0.08] border-cyan-500/20",
    pillText: "text-cyan-300",
    pillIcon: "text-cyan-400",
    topBar: "from-cyan-400 to-blue-500",
  },
  fuchsia: {
    border: "border-fuchsia-500/30",
    glow: "shadow-[0_0_40px_-12px_rgba(192,38,211,0.25)]",
    check: "text-fuchsia-400",
    btn: "bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white hover:brightness-110",
    pillBg: "bg-fuchsia-500/[0.08] border-fuchsia-500/20",
    pillText: "text-fuchsia-300",
    pillIcon: "text-fuchsia-400",
    topBar: "from-fuchsia-500 to-violet-500",
  },
  amber: {
    border: "border-amber-500/25",
    glow: "shadow-[0_0_40px_-12px_rgba(245,158,11,0.2)]",
    check: "text-amber-400",
    btn: "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:brightness-110",
    pillBg: "bg-amber-500/[0.08] border-amber-500/20",
    pillText: "text-amber-300",
    pillIcon: "text-amber-400",
    topBar: "from-amber-400 to-orange-500",
  },
};

/* ─────────────── FAQ data ─────────────── */
const FAQS = [
  { q: "Can I cancel my subscription any time?", a: "Yes. You can cancel anytime from your billing settings. Your credits remain active until the end of your billing cycle." },
  { q: "How do I cancel my subscription?", a: "Go to Settings → Billing → Manage Subscription. Click 'Cancel Subscription'. Your plan will remain active until the end of the current period." },
  { q: "Do my monthly credits roll over?", a: "Unused credits roll over for one billing cycle. After that, unspent credits expire." },
  { q: "What's the difference between monthly and annual plans?", a: "Annual plans save up to 50% compared to monthly billing. You pay once per year. Credits are still distributed monthly." },
  { q: "What are add-ons?", a: "Add-on Credit Packs let you purchase extra credits on top of your plan's monthly allocation. Available on Creator and Agency plans." },
  { q: "What happens when I upgrade?", a: "You'll immediately get access to the new plan's features and a pro-rated credit allocation. Any existing credits carry over." },
  { q: "What happens when I downgrade/cancel?", a: "Your current plan stays active until the end of the billing period. After that, you'll move to the lower plan. Your storefront remains live." },
  { q: "How does the 0% fee work?", a: "On the Agency plan, SellsPay takes $0 from your sales. You keep 100% of your revenue (minus standard Stripe processing fees of ~2.9% + 30¢)." },
];

/* ─────────────── Comparison rows ─────────────── */
const CREDIT_ROWS = [
  { label: "Credits", values: ["0", "500/mo", "2,500/mo", "6,000/mo"] },
  { label: "Add-on Credit Packs", values: [false, false, true, true] },
  { label: "Number of Images", values: ["0", "~250/mo", "~1,250/mo", "~3,000/mo"] },
  { label: "Number of Videos", values: ["0", "0", "~125/mo", "~300/mo"] },
  { label: "AI Code Iterations", values: ["0", "~166/mo", "~833/mo", "~2,000/mo"] },
  { label: "Parallel Generations", values: ["1", "4", "8", "16"] },
  { label: "Transaction Fee", values: ["10%", "8%", "5%", "0%"] },
] as { label: string; values: (string | boolean)[] }[];

const FEATURE_ROWS = [
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
] as { label: string; values: (string | boolean)[] }[];

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
    navigate(user ? "/billing" : "/signup");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[1400px] w-[98vw] p-0 rounded-2xl overflow-hidden max-h-[95vh] flex flex-col border border-white/[0.08] shadow-2xl"
        style={{ background: '#050505' }}
      >
        <VisuallyHidden><DialogTitle>Pricing Plans</DialogTitle></VisuallyHidden>

        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 pricing-scroll">

          {/* Header */}
          <div className="text-center pt-14 pb-8 px-8 relative">
            {/* Subtle top glow */}
            <div className="absolute inset-x-0 top-0 h-40 pointer-events-none" style={{
              background: 'radial-gradient(ellipse at top center, rgba(37,99,235,0.08) 0%, transparent 70%)'
            }} />

            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-primary/70 mb-4 relative">Pricing</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white relative">
              Choose Your Plan
            </h2>
            <p className="mt-3 text-base text-white/40 max-w-lg mx-auto relative">
              Scale your creative business with AI-powered tools.
            </p>

            {/* Billing Toggle */}
            <div className="flex justify-center mt-8 relative">
              <div className="inline-flex items-center rounded-full p-1 bg-white/[0.04] border border-white/[0.08]">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={cn(
                    "px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200",
                    billingPeriod === "monthly"
                      ? "bg-white/[0.1] text-white shadow-sm"
                      : "text-white/40 hover:text-white/60"
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("annually")}
                  className={cn(
                    "px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                    billingPeriod === "annually"
                      ? "bg-white/[0.1] text-white shadow-sm"
                      : "text-white/40 hover:text-white/60"
                  )}
                >
                  Annually
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                    SAVE 50%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ─── Plan Cards ─── */}
          <div className="px-6 sm:px-8 pb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-[1300px] mx-auto">
              {PLAN_CARDS.map((plan) => {
                const price = billingPeriod === "annually" ? plan.yearlyPrice : plan.monthlyPrice;
                const originalPrice = billingPeriod === "annually" && plan.monthlyPrice > 0 ? plan.monthlyPrice : null;
                const s = ACCENT_STYLES[plan.accent];

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative rounded-2xl flex flex-col border transition-colors",
                      s.border,
                      s.glow,
                    )}
                    style={{ background: '#0a0a0a' }}
                  >
                    {/* Top accent bar */}
                    <div className={cn("h-1 w-full rounded-t-2xl bg-gradient-to-r", s.topBar)} />

                    {/* Card content */}
                    <div className="p-6 pb-0">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                        {plan.badge && (
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider text-white",
                            plan.badgeColor
                          )}>
                            {plan.badge}
                          </span>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-1.5 mt-4">
                        {originalPrice !== null && (
                          <span className="text-sm line-through text-white/30">${originalPrice}</span>
                        )}
                        <span className="text-4xl font-extrabold text-white">${price}</span>
                        <span className="text-sm text-white/40">/mo</span>
                      </div>

                      {/* CTA */}
                      <button
                        onClick={() => handleGetStarted(plan.id)}
                        className={cn(
                          "mt-5 w-full py-3 rounded-xl text-sm font-bold transition-all cursor-pointer",
                          s.btn
                        )}
                      >
                        Get Started
                      </button>

                      <p className="text-xs mt-4 leading-relaxed text-white/35">{plan.tagline}</p>
                    </div>

                    {/* Credits pill */}
                    <div className={cn("mx-5 mt-4 px-4 py-3 rounded-xl border", s.pillBg)}>
                      <div className="flex items-center gap-2">
                        <Diamond className={cn("h-4 w-4", s.pillIcon)} />
                        <span className={cn("text-sm font-bold", s.pillText)}>{plan.credits}</span>
                      </div>
                      {plan.addOns && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <LinkIcon className={cn("h-3 w-3", s.pillIcon)} />
                          <span className={cn("text-[11px] font-semibold", s.pillText)}>Add credits as needed</span>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <div className="p-5 pt-4 flex-1">
                      <ul className="space-y-2.5">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <Check className={cn("h-4 w-4 shrink-0 mt-0.5", s.check)} />
                            <span className="text-[13px] leading-relaxed text-white/50">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Comparison Table ─── */}
          <div className="px-6 sm:px-8 pb-12">
            <div className="max-w-[1300px] mx-auto overflow-x-auto">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr>
                    <th className="w-[220px]" />
                    {PLAN_CARDS.map((p) => (
                      <th key={p.id} className="text-center px-4 pb-4 min-w-[160px]">
                        <span className="text-sm font-bold text-white">{p.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Credits section */}
                  <tr>
                    <td colSpan={5} className="pt-6 pb-4 px-1">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold text-white">Credits Usage</span>
                      </div>
                    </td>
                  </tr>
                  {CREDIT_ROWS.map((row, i) => (
                    <tr key={`cu-${i}`} className="border-t border-white/[0.05]">
                      <td className="py-3.5 px-1 text-sm text-white/40">{row.label}</td>
                      {row.values.map((val, j) => (
                        <td key={j} className="py-3.5 px-4 text-center">
                          {val === true ? <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                            : val === false ? <span className="text-white/15">—</span>
                            : <span className="text-sm font-medium text-white">{val}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Features section */}
                  <tr>
                    <td colSpan={5} className="pt-12 pb-4 px-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold text-white">Features</span>
                      </div>
                    </td>
                  </tr>
                  {FEATURE_ROWS.map((row, i) => (
                    <tr key={`ft-${i}`} className="border-t border-white/[0.05]">
                      <td className="py-3.5 px-1 text-sm text-white/40">{row.label}</td>
                      {row.values.map((val, j) => (
                        <td key={j} className="py-3.5 px-4 text-center">
                          {val === true ? <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                            : val === false ? <span className="text-white/15">—</span>
                            : <span className="text-sm font-medium text-white">{val}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── FAQ ─── */}
          <div className="px-6 sm:px-8 pb-14">
            <div className="max-w-[900px] mx-auto">
              <div className="flex items-start gap-10">
                <h3 className="text-xl font-bold shrink-0 pt-3 text-white">FAQs</h3>
                <div className="flex-1 divide-y divide-white/[0.06]">
                  {FAQS.map((faq, idx) => (
                    <div key={idx}>
                      <button
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        className="w-full flex items-center justify-between py-4 text-left group cursor-pointer"
                      >
                        <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                          {faq.q}
                        </span>
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-4 transition-colors",
                          openFaq === idx ? "bg-primary text-white" : "bg-white/[0.06] text-white/40"
                        )}>
                          {openFaq === idx ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        </div>
                      </button>
                      {openFaq === idx && (
                        <div className="pb-4 overflow-hidden">
                          <p className="text-sm leading-relaxed text-white/40 pr-10">{faq.a}</p>
                        </div>
                      )}
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
