import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Check, X, Plus, Minus, Sparkles, Zap, Diamond } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogPortal, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

/* ─────────────── Plan data (from DB) ─────────────── */
const PLAN_CARDS = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 0,
    yearlyPrice: 0,
    badge: null,
    credits: "0",
    modelTier: "—",
    features: [
      "Create & Customize Storefront",
      "Sell Digital Products & Subs",
      "Buy from Marketplace",
      "Community Access",
    ],
    feeNote: "10% Transaction Fee",
    highlights: [],
  },
  {
    id: "basic",
    name: "Basic",
    monthlyPrice: 25,
    yearlyPrice: 25,
    badge: null,
    credits: "500",
    modelTier: "Flash",
    features: [
      "VibeCoder AI Builder",
      "All Audio Tools",
      "AI Storefront Editor",
      "Flash Models (Gemini Flash, GPT-5 Nano)",
      "~250 images / mo",
      "4 parallel generations",
    ],
    feeNote: "8% Transaction Fee",
    highlights: [],
  },
  {
    id: "creator",
    name: "Creator",
    monthlyPrice: 69,
    yearlyPrice: 69,
    badge: "MOST POPULAR",
    credits: "2,500",
    modelTier: "Pro",
    features: [
      "Everything in Basic, plus:",
      "Pro Models (GPT-5, Gemini Pro)",
      "AI Image Generation (Flux, Grok, Gemini)",
      "Auto-Model Selection",
      "Advanced Analytics",
      "~1,250 images / mo",
      "~35 videos / mo",
      "8 parallel generations",
      "Verified Badge (Grey)",
      "Commercial Use Rights",
    ],
    feeNote: "5% Transaction Fee",
    highlights: [],
  },
  {
    id: "agency",
    name: "Agency",
    monthlyPrice: 199,
    yearlyPrice: 199,
    badge: "BEST VALUE",
    credits: "6,000",
    modelTier: "Flagship",
    features: [
      "Everything in Creator, plus:",
      "Flagship Models (GPT-5.2)",
      "AI Video Generation (Sora 2, Veo 3.1)",
      "~3,000 images / mo",
      "~75 videos / mo",
      "16 parallel generations",
      "Verified Badge (Gold)",
      "Priority Processing",
      "Priority Support",
    ],
    feeNote: "0% Transaction Fee",
    highlights: [],
  },
];

const AI_MODELS = [
  { name: "GPT-5" },
  { name: "GPT-5.2" },
  { name: "Gemini Pro" },
  { name: "Sora 2" },
  { name: "Veo 3.1" },
  { name: "Flux.2" },
  { name: "Kling" },
  { name: "Grok" },
];

/* ─────────────── Credit cost reference ─────────────── */
const CREDIT_COSTS = [
  { category: "Text / Code", items: [
    { name: "Flash models", cost: "~0.2–0.6 credits / 1K tokens" },
    { name: "Pro models", cost: "~2.5–4 credits / 1K tokens" },
    { name: "Flagship (GPT-5.2)", cost: "~6 credits / 1K tokens" },
  ]},
  { category: "Images", items: [
    { name: "Standard (Flux Dev, Seedream)", cost: "1–2 credits" },
    { name: "Pro (Flux Pro, Grok Imagine)", cost: "3–8 credits" },
  ]},
  { category: "Video", items: [
    { name: "Standard (Kling 3.0)", cost: "50 credits" },
    { name: "Pro (Kling O3, Grok Video)", cost: "60–70 credits" },
    { name: "Flagship (Sora 2, Veo 3.1)", cost: "80 credits" },
  ]},
];

/* ─────────────── FAQ ─────────────── */
const FAQS = [
  { q: "Can I cancel my subscription any time?", a: "Yes. You can cancel anytime from your billing settings. Your credits remain active until the end of your billing cycle." },
  { q: "Do my monthly credits roll over?", a: "Unused credits roll over for one billing cycle. After that, unspent credits expire." },
  { q: "What happens when I run out of credits?", a: "You can purchase add-on Credit Packs: 25 credits for $5, 100 for $15, or 300 for $35." },
  { q: "What are the model tiers?", a: "Flash = fast & affordable models. Pro = high-quality models for images & code. Flagship = the most powerful AI models available." },
  { q: "What happens when I upgrade?", a: "You'll immediately get access to the new plan's features and a pro-rated credit allocation." },
  { q: "How does the 0% fee work?", a: "On the Agency plan, SellsPay takes $0 from your sales. You keep 100% of your revenue (minus standard Stripe processing fees)." },
];

/* ─────────────── Comparison rows ─────────────── */
const COMPARISON_ROWS = [
  { label: "Monthly Credits", values: ["0", "500", "2,500", "6,000"] },
  { label: "Model Tier", values: ["—", "Flash", "Pro", "Flagship"] },
  { label: "Images / mo", values: ["—", "~250", "~1,250", "~3,000"] },
  { label: "Videos / mo", values: ["—", "—", "~35", "~75"] },
  { label: "Parallel Generations", values: ["1", "4", "8", "16"] },
  { label: "Transaction Fee", values: ["10%", "8%", "5%", "0%"] },
] as { label: string; values: string[] }[];

const FEATURE_ROWS = [
  { label: "VibeCoder AI Builder", values: [false, true, true, true] },
  { label: "AI Image Generation", values: [false, false, true, true] },
  { label: "AI Video Generation", values: [false, false, false, true] },
  { label: "Auto-Model Selection", values: [false, false, true, true] },
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
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = (planId: string) => {
    onOpenChange(false);
    navigate(user ? "/billing" : "/signup");
  };

  const ACCENT: Record<string, { border: string; check: string; btn: string }> = {
    starter: {
      border: "border-white/[0.06]",
      check: "text-zinc-400",
      btn: "bg-white/[0.06] hover:bg-white/[0.1] text-white/80 border border-white/[0.08]",
    },
    basic: {
      border: "border-cyan-500/20",
      check: "text-cyan-400",
      btn: "bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:brightness-110",
    },
    creator: {
      border: "border-blue-500/30",
      check: "text-blue-400",
      btn: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:brightness-110",
    },
    agency: {
      border: "border-indigo-500/25",
      check: "text-indigo-400",
      btn: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:brightness-110",
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 w-[98vw] max-w-[1400px] max-h-[95vh] translate-x-[-50%] translate-y-[-50%] rounded-2xl overflow-hidden flex flex-col border border-white/[0.06] shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          style={{ background: '#0c0c0c' }}
        >
          <VisuallyHidden><DialogTitle>Pricing Plans</DialogTitle></VisuallyHidden>

          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="overflow-y-auto flex-1 pricing-scroll">

            {/* Header */}
            <div className="text-center pt-14 pb-6 px-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                Get the perfect plan for you
              </h2>
              <p className="mt-3 text-base text-white/40 max-w-lg mx-auto">
                Scale your creative business with AI-powered tools.
              </p>

              {/* AI Model icons row */}
              <div className="flex justify-center items-center gap-5 sm:gap-7 mt-6 flex-wrap">
                {AI_MODELS.map((model) => (
                  <div key={model.name} className="flex items-center gap-1.5 text-white/40">
                    <Sparkles className="w-3 h-3" />
                    <span className="text-xs font-medium">{model.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Plan Cards ─── */}
            <div className="px-4 sm:px-6 lg:px-8 pb-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-[1300px] mx-auto">
                {PLAN_CARDS.map((plan) => {
                  const a = ACCENT[plan.id];

                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        "relative rounded-xl flex flex-col border transition-colors",
                        a.border,
                        plan.badge === "MOST POPULAR" && "shadow-[0_0_40px_-12px_rgba(59,130,246,0.25)]",
                      )}
                      style={{ background: '#111111' }}
                    >
                      {/* Badge */}
                      {plan.badge && (
                        <div className="flex justify-center -mt-3.5">
                          <span className={cn(
                            "px-4 py-1 rounded-full text-xs font-bold border",
                            plan.badge === "MOST POPULAR"
                              ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
                              : "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
                          )}>
                            ✦ {plan.badge}
                          </span>
                        </div>
                      )}

                      <div className={cn("p-6 pb-0", plan.badge ? "pt-3" : "pt-6")}>
                        <h3 className="text-lg font-bold text-white">{plan.name}</h3>

                        {/* Price */}
                        <div className="mt-3 flex items-baseline gap-0.5">
                          {plan.monthlyPrice === 0 ? (
                            <span className="text-3xl font-extrabold text-white">Free</span>
                          ) : (
                            <>
                              <span className="text-3xl font-extrabold text-white">${plan.monthlyPrice}</span>
                              <span className="text-sm text-white/35 ml-1">/month</span>
                            </>
                          )}
                        </div>

                        {/* Credits pill */}
                        <div className="mt-4 px-3 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center gap-2">
                          <Diamond className="h-4 w-4 text-blue-400/70" />
                          <span className="text-sm font-semibold text-white/70">{plan.credits} credits / mo</span>
                        </div>

                        {/* Model tier */}
                        <p className="text-[11px] text-white/30 mt-2">
                          Model tier: <span className="text-white/50 font-medium">{plan.modelTier}</span>
                        </p>

                        {/* CTA */}
                        <button
                          onClick={() => handleGetStarted(plan.id)}
                          className={cn(
                            "mt-4 w-full py-3.5 rounded-full text-sm font-bold transition-all cursor-pointer",
                            a.btn
                          )}
                        >
                          Get Started
                        </button>

                        <p className="text-[11px] text-white/25 mt-2 text-center">{plan.feeNote}</p>
                      </div>

                      {/* Features */}
                      <div className="p-5 pt-4 flex-1">
                        <ul className="space-y-2.5">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <Check className={cn("h-4 w-4 shrink-0 mt-0.5", a.check)} />
                              <span className="text-[12px] leading-relaxed text-white/50">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ─── Credit Cost Reference ─── */}
            <div className="px-6 sm:px-8 pb-12">
              <div className="max-w-[1300px] mx-auto">
                <div className="flex items-center gap-2 mb-6">
                  <Zap className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-bold text-white">Credit Usage Guide</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {CREDIT_COSTS.map((cat) => (
                    <div key={cat.category} className="rounded-xl border border-white/[0.06] p-5" style={{ background: '#111' }}>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3">{cat.category}</h4>
                      <ul className="space-y-2">
                        {cat.items.map((item) => (
                          <li key={item.name} className="flex justify-between items-baseline">
                            <span className="text-[12px] text-white/40">{item.name}</span>
                            <span className="text-[12px] font-semibold text-white/60">{item.cost}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
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
                    {COMPARISON_ROWS.map((row, i) => (
                      <tr key={`cr-${i}`} className="border-t border-white/[0.05]">
                        <td className="py-3.5 px-1 text-sm text-white/40">{row.label}</td>
                        {row.values.map((val, j) => (
                          <td key={j} className="py-3.5 px-4 text-center">
                            <span className="text-sm font-medium text-white">{val}</span>
                          </td>
                        ))}
                      </tr>
                    ))}

                    <tr>
                      <td colSpan={5} className="pt-8 pb-4 px-1">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-blue-400" />
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
                <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-10">
                  <h3 className="text-xl font-bold shrink-0 pt-1 text-white">FAQs</h3>
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
                            openFaq === idx ? "bg-blue-500/20 text-blue-400" : "bg-white/[0.06] text-white/40"
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
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
