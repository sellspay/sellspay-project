import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Check, X, Plus, Minus, Sparkles, Zap, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogPortal, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

/* ─────────────── AI Models row ─────────────── */
const AI_MODELS = [
  "Sora", "Veo", "Gemini Pro", "Kling", "GPT-5", "GPT-5.2", "Flux.2", "Grok",
];

/* ─────────────── Credit options per plan ─────────────── */
const STARTER_CREDITS = [
  { credits: "500", images: "~250", videos: "—", voiceovers: "—" },
  { credits: "1,000", images: "~500", videos: "~6", voiceovers: "~2 hrs" },
  { credits: "2,500", images: "~1,250", videos: "~16", voiceovers: "~5 hrs" },
];

const PRO_CREDITS = [
  { credits: "2,500", images: "~1,250", videos: "~35", voiceovers: "~5 hrs", savings: "" },
  { credits: "6,000", images: "~3,000", videos: "~75", voiceovers: "~12 hrs", savings: "40% less per credit" },
  { credits: "12,000", images: "~6,000", videos: "~150", voiceovers: "~24 hrs", savings: "55% less per credit" },
];

/* ─────────────── Plan data ─────────────── */
const PLAN_CARDS = [
  {
    id: "starter",
    name: "AI Starter",
    originalPrice: 39,
    price: 25,
    perMonth: true,
    badge: null,
    creditOptions: STARTER_CREDITS,
    defaultCreditIdx: 0,
    features: [
      "VibeCoder AI Builder",
      "AI Images",
      "AI Storefront Editor",
      "Flash Models",
    ],
    cta: "Get Started",
    enterprise: false,
  },
  {
    id: "creator",
    name: "AI Professional",
    originalPrice: 149,
    price: 69,
    perMonth: true,
    badge: "✦ Best Value",
    creditOptions: PRO_CREDITS,
    defaultCreditIdx: 0,
    features: [
      { text: "Includes up to 5 members", icon: "users" },
      "AI Videos",
      "AI Images",
      "AI Voiceovers",
      "AI Music",
      "Priority generation speed",
    ],
    cta: "Get Started",
    enterprise: false,
  },
  {
    id: "agency",
    name: "Enterprise",
    originalPrice: null,
    price: null,
    perMonth: false,
    badge: null,
    creditOptions: null,
    defaultCreditIdx: 0,
    description: "Tailored plan designed to scale with your organization's creative needs",
    customCredits: true,
    features: [
      { text: "Unlimited team members", icon: "users" },
      "AI Videos",
      "AI Images",
      "AI Voiceovers",
      "AI Music",
      "Stock Catalog – Business License",
    ],
    businessFeatures: [
      "Legal indemnification",
      "Guaranteed SLA",
      "Enterprise-grade security & compliance",
      "SSO authentication",
      "Curation service & AI creative support",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    enterprise: true,
  },
];

/* ─────────────── FAQ ─────────────── */
const FAQS = [
  { q: "Can I cancel my subscription any time?", a: "Yes. You can cancel anytime from your billing settings. Your credits remain active until the end of your billing cycle." },
  { q: "Do my monthly credits roll over?", a: "Unused credits roll over for one billing cycle. After that, unspent credits expire." },
  { q: "What happens when I run out of credits?", a: "You can purchase add-on Credit Packs at any time." },
  { q: "What are the model tiers?", a: "Flash = fast & affordable models. Pro = high-quality models for images & code. Flagship = the most powerful AI models available." },
  { q: "How does the 0% fee work?", a: "On the Agency plan, SellsPay takes $0 from your sales. You keep 100% of your revenue (minus standard Stripe processing fees)." },
];

/* ─────────────── Component ─────────────── */

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  darkMode?: boolean;
}

export function PricingModal({ open, onOpenChange }: PricingModalProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingYearly, setBillingYearly] = useState(true);
  const [creditSelections, setCreditSelections] = useState<Record<string, number>>({
    starter: 0,
    creator: 0,
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = (planId: string) => {
    onOpenChange(false);
    navigate(user ? "/billing" : "/signup");
  };

  const setCreditIdx = (planId: string, idx: number) => {
    setCreditSelections(prev => ({ ...prev, [planId]: idx }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 w-[98vw] max-w-[1400px] max-h-[95vh] translate-x-[-50%] translate-y-[-50%] rounded-2xl overflow-hidden flex flex-col border border-white/[0.06] shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          style={{ background: '#0a0a0a' }}
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
            <div className="text-center pt-14 pb-4 px-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                Get the perfect AI plan for you
              </h2>

              {/* AI Suite tab */}
              <div className="flex justify-center mt-6">
                <div className="inline-flex rounded-full border border-white/[0.1] bg-white/[0.04] p-1">
                  <button className="px-5 py-2 rounded-full text-sm font-medium bg-white/[0.1] text-white">
                    ✦ AI Suite
                  </button>
                </div>
              </div>

              {/* AI Model icons row */}
              <div className="flex justify-center items-center gap-5 sm:gap-7 mt-5 flex-wrap">
                {AI_MODELS.map((model) => (
                  <div key={model} className="flex items-center gap-1.5 text-white/40">
                    <Sparkles className="w-3 h-3" />
                    <span className="text-xs font-medium">{model}</span>
                  </div>
                ))}
              </div>

              {/* Billing toggle */}
              <div className="flex justify-center items-center gap-3 mt-5">
                <span className={cn("text-sm", !billingYearly ? "text-white" : "text-white/40")}>Monthly</span>
                <button
                  onClick={() => setBillingYearly(!billingYearly)}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors",
                    billingYearly ? "bg-emerald-500" : "bg-white/20"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                    billingYearly ? "left-[22px]" : "left-0.5"
                  )} />
                </button>
                <span className={cn("text-sm", billingYearly ? "text-white" : "text-white/40")}>Yearly</span>
                {billingYearly && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Save 40%
                  </span>
                )}
              </div>
            </div>

            {/* ─── Plan Cards ─── */}
            <div className="px-4 sm:px-6 lg:px-8 pb-12 pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-[1200px] mx-auto items-start">
                {PLAN_CARDS.map((plan) => {
                  const selectedIdx = creditSelections[plan.id] || 0;
                  const selectedCredit = plan.creditOptions?.[selectedIdx];

                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        "relative rounded-xl flex flex-col border transition-colors",
                        plan.badge
                          ? "border-white/[0.12] shadow-[0_0_50px_-12px_rgba(255,215,0,0.15)]"
                          : "border-white/[0.06]",
                      )}
                      style={{ background: '#111111' }}
                    >
                      {/* Badge */}
                      {plan.badge && (
                        <div className="flex justify-center -mt-3.5">
                          <span className="px-5 py-1 rounded-full text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                            {plan.badge}
                          </span>
                        </div>
                      )}

                      <div className={cn("p-6", plan.badge ? "pt-3" : "pt-6")}>
                        <h3 className="text-lg font-bold text-white">{plan.name}</h3>

                        {/* Enterprise description */}
                        {plan.enterprise && (
                          <p className="mt-3 text-sm text-white/50 leading-relaxed">
                            {(plan as any).description}
                          </p>
                        )}

                        {/* Price */}
                        {plan.price !== null && (
                          <div className="mt-3">
                            {plan.originalPrice && (
                              <span className="text-sm text-white/30 line-through mr-2">
                                ${plan.originalPrice.toFixed(2)}
                              </span>
                            )}
                            <div className="flex items-baseline gap-0.5 mt-1">
                              <span className="text-4xl font-extrabold text-white">${plan.price}</span>
                              <span className="text-lg font-bold text-white/60 relative -top-3">.99</span>
                              <span className="text-sm text-white/35 ml-1">/month</span>
                            </div>
                            {billingYearly && (
                              <p className="text-xs text-white/30 mt-1">Billed annually</p>
                            )}
                          </div>
                        )}

                        {/* Enterprise custom credits label */}
                        {plan.enterprise && (
                          <p className="mt-6 text-sm font-semibold text-white/70">Custom credits</p>
                        )}

                        {/* Credit selector dropdown */}
                        {plan.creditOptions && (
                          <div className="mt-5">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-white/40">Select your monthly credits:</span>
                              {selectedCredit && (selectedCredit as any).savings && (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                  {(selectedCredit as any).savings}
                                </span>
                              )}
                            </div>
                            <div className="relative">
                              <select
                                value={selectedIdx}
                                onChange={(e) => setCreditIdx(plan.id, Number(e.target.value))}
                                className="w-full appearance-none px-4 py-3 rounded-lg border border-white/[0.1] bg-white/[0.03] text-white text-sm font-medium cursor-pointer focus:outline-none focus:border-white/20"
                                style={{ background: '#0d0d0d' }}
                              >
                                {plan.creditOptions.map((opt, i) => (
                                  <option key={i} value={i} className="bg-[#111] text-white">
                                    {opt.credits} credits / ~{opt.images} images / ~{opt.videos} videos
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* CTA Button - 3D gold style */}
                        <button
                          onClick={() => handleGetStarted(plan.id)}
                          className="mt-5 w-full py-3.5 rounded-full text-sm font-bold cursor-pointer transition-all active:scale-[0.98]"
                          style={plan.enterprise ? {
                            background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.8)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.3)',
                          } : {
                            background: 'linear-gradient(180deg, #ffe066 0%, #f5c200 30%, #d4a000 100%)',
                            color: '#1a1200',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.15), 0 2px 12px rgba(245,194,0,0.3), 0 4px 20px rgba(245,194,0,0.15)',
                            textShadow: '0 1px 0 rgba(255,255,255,0.2)',
                          }}
                        >
                          {plan.cta}
                        </button>
                      </div>

                      {/* Features */}
                      <div className="px-6 pb-6 flex-1">
                        <ul className="space-y-3">
                          {plan.features.map((feature, i) => {
                            const isObj = typeof feature === 'object';
                            const text = isObj ? (feature as any).text : feature;
                            const hasUsers = isObj && (feature as any).icon === 'users';
                            return (
                              <li key={i} className="flex items-start gap-2.5">
                                {hasUsers ? (
                                  <Users className="h-4 w-4 shrink-0 mt-0.5 text-white/40" />
                                ) : (
                                  <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                                )}
                                <span className="text-[13px] leading-relaxed text-white/55">{text}</span>
                              </li>
                            );
                          })}
                        </ul>

                        {/* Business features for Enterprise */}
                        {(plan as any).businessFeatures && (
                          <div className="mt-6">
                            <p className="text-xs font-bold text-white/70 mb-3">Business features:</p>
                            <ul className="space-y-2">
                              {(plan as any).businessFeatures.map((f: string, i: number) => (
                                <li key={i} className="flex items-start gap-2.5">
                                  <span className="text-white/20 mt-0.5">•</span>
                                  <span className="text-[12px] text-white/45">{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                            openFaq === idx ? "bg-yellow-500/20 text-yellow-400" : "bg-white/[0.06] text-white/40"
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
