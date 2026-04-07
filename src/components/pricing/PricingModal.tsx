import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Check, X, ChevronDown, Plus, Minus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogPortal, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

/* ─────────────── Plan data ─────────────── */
const PLAN_CARDS = [
  {
    id: "starter",
    name: "Music & SFX",
    subtitle: null,
    monthlyPrice: 9.99,
    yearlyPrice: 9.99,
    badge: null,
    cta: "Get Started",
    license: "License",
    licenseDesc: "Covers all personal and commercial use of music and sound effects.",
    features: [
      "Music and stems",
      "Sound effects",
      "Extension for Premiere Pro",
    ],
    businessFeatures: [],
  },
  {
    id: "basic",
    name: "Max",
    subtitle: null,
    monthlyPrice: 49.99,
    yearlyPrice: 39.99,
    badge: "✦ Best Value",
    cta: "Get Started",
    license: "Pro License",
    licenseDesc: "Covers all personal and commercial use of the stock catalog.",
    features: [
      "Music, stems and sound effects",
      "Footage, templates and LUTs",
      "Plugins and extensions",
      "Full access to AI Toolkit",
    ],
    businessFeatures: [],
  },
  {
    id: "creator",
    name: "Max Business",
    subtitle: "For businesses with 50+ employees and agencies of all sizes",
    monthlyPrice: 499,
    yearlyPrice: 399,
    badge: null,
    cta: "Get Started",
    license: "Business License",
    licenseDesc: "Covers your business and client projects for commercial use of the stock catalog.",
    features: [
      "Includes up to 7 members",
      "Stock catalog",
      "Full access to AI Toolkit",
    ],
    businessFeatures: [
      "Legal indemnification",
      "Guaranteed SLA",
      "Security & compliance",
      "Team collaboration tools",
      "Team credit & model control",
      "Priority generation speed",
      "Priority support",
    ],
  },
  {
    id: "agency",
    name: "Enterprise",
    subtitle: "Tailored for enterprise companies of 50+ employees and agencies of all sizes",
    monthlyPrice: 0,
    yearlyPrice: 0,
    badge: null,
    cta: "Contact Sales",
    license: "Enterprise License",
    licenseDesc: "Tailored enterprise license covering commercial use of the stock catalog.",
    features: [
      "Custom number of members",
    ],
    businessFeatures: [
      "Everything in Max Business, plus:",
      "SSO authentication",
      "Enhanced legal indemnification",
      "Curation service & AI Support",
      "Dedicated account manager",
      "Customized privacy terms",
    ],
  },
];

const AI_MODELS = [
  { icon: "✦", name: "Sora" },
  { icon: "G", name: "Veo" },
  { icon: "G", name: "Nano Banana" },
  { icon: "◈", name: "Kling" },
  { icon: "▊", name: "Seedance" },
  { icon: "II", name: "ElevenLabs" },
  { icon: "◈", name: "GPT Image" },
  { icon: "G", name: "Lyria" },
];

/* ─────────────── FAQ data ─────────────── */
const FAQS = [
  { q: "Can I cancel my subscription any time?", a: "Yes. You can cancel anytime from your billing settings. Your credits remain active until the end of your billing cycle." },
  { q: "How do I cancel my subscription?", a: "Go to Settings → Billing → Manage Subscription. Click 'Cancel Subscription'. Your plan will remain active until the end of the current period." },
  { q: "Do my monthly credits roll over?", a: "Unused credits roll over for one billing cycle. After that, unspent credits expire." },
  { q: "What's the difference between monthly and annual plans?", a: "Annual plans save up to 50% compared to monthly billing. You pay once per year. Credits are still distributed monthly." },
  { q: "What are add-ons?", a: "Add-on Credit Packs let you purchase extra credits on top of your plan's monthly allocation. Available on Creator and Agency plans." },
  { q: "What happens when I upgrade?", a: "You'll immediately get access to the new plan's features and a pro-rated credit allocation. Any existing credits carry over." },
];

/* ─────────────── Component ─────────────── */

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  darkMode?: boolean;
}

export function PricingModal({ open, onOpenChange, darkMode = false }: PricingModalProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "stock">("ai");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = (planId: string) => {
    onOpenChange(false);
    if (planId === "agency") {
      navigate("/contact");
    } else {
      navigate(user ? "/billing" : "/signup");
    }
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
            <div className="text-center pt-14 pb-6 px-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                Get the perfect plan for you
              </h2>

              {/* Tab Toggle */}
              <div className="flex justify-center mt-8">
                <div className="inline-flex items-center rounded-full p-1 bg-white/[0.04] border border-white/[0.08]">
                  <button
                    onClick={() => setActiveTab("ai")}
                    className={cn(
                      "px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                      activeTab === "ai"
                        ? "bg-white/[0.1] text-white shadow-sm"
                        : "text-white/40 hover:text-white/60"
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Suite
                  </button>
                  <button
                    onClick={() => setActiveTab("stock")}
                    className={cn(
                      "px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200",
                      activeTab === "stock"
                        ? "bg-white/[0.1] text-white shadow-sm"
                        : "text-white/40 hover:text-white/60"
                    )}
                  >
                    Stock Catalog
                  </button>
                </div>
              </div>

              {/* AI Model icons row */}
              <div className="flex justify-center items-center gap-6 sm:gap-8 mt-6 flex-wrap">
                {AI_MODELS.map((model) => (
                  <div key={model.name} className="flex items-center gap-1.5 text-white/40">
                    <span className="text-xs font-bold">{model.icon}</span>
                    <span className="text-xs font-medium">{model.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Plan Cards ─── */}
            <div className="px-4 sm:px-6 lg:px-8 pb-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-[1300px] mx-auto">
                {PLAN_CARDS.map((plan) => {
                  const isEnterprise = plan.id === "agency";
                  const isBestValue = !!plan.badge;

                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        "relative rounded-xl flex flex-col border transition-colors",
                        isBestValue
                          ? "border-amber-500/30"
                          : "border-white/[0.06]",
                      )}
                      style={{ background: '#111111' }}
                    >
                      {/* Best Value Badge */}
                      {plan.badge && (
                        <div className="flex justify-center -mt-3.5">
                          <span className="px-4 py-1 rounded-full text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20">
                            {plan.badge}
                          </span>
                        </div>
                      )}

                      <div className={cn("p-6 pb-0", plan.badge ? "pt-3" : "pt-6")}>
                        {/* Name */}
                        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                        {plan.subtitle && (
                          <p className="text-[11px] text-white/35 mt-1 leading-snug">{plan.subtitle}</p>
                        )}

                        {/* Price */}
                        <div className="mt-4">
                          {isEnterprise ? (
                            <span className="text-3xl font-bold text-white">Custom</span>
                          ) : (
                            <div className="flex items-baseline gap-0.5">
                              <span className="text-3xl font-extrabold text-white">
                                ${Math.floor(plan.yearlyPrice)}
                              </span>
                              <span className="text-lg font-bold text-white/60">
                                .{String(Math.round((plan.yearlyPrice % 1) * 100)).padStart(2, '0')}
                              </span>
                              <span className="text-sm text-white/35 ml-1">/month</span>
                            </div>
                          )}
                          {!isEnterprise && plan.id !== "starter" && (
                            <p className="text-[11px] text-white/30 mt-0.5">Billed annually</p>
                          )}
                          {plan.id === "starter" && (
                            <p className="text-[11px] text-white/30 mt-0.5">Starting at</p>
                          )}
                        </div>

                        {/* Credits selector for mid-tiers */}
                        {(plan.id === "basic" || plan.id === "creator") && (
                          <div className="mt-4">
                            <p className="text-[11px] text-white/40 mb-1.5">Select your monthly credits:</p>
                            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03]">
                              <div>
                                <span className="text-sm font-semibold text-white">
                                  {plan.id === "basic" ? "7,500 credits" : "180,000 credits"}
                                </span>
                                <p className="text-[10px] text-white/30 mt-0.5">
                                  {plan.id === "basic"
                                    ? "~25 videos / ~250 images / ~15 hours of voiceovers"
                                    : "~1125 videos / ~18000 images / ~36 hours of voiceovers"}
                                </p>
                              </div>
                              <ChevronDown className="w-4 h-4 text-white/30 shrink-0" />
                            </div>
                          </div>
                        )}

                        {/* CTA Button */}
                        <button
                          onClick={() => handleGetStarted(plan.id)}
                          className={cn(
                            "mt-5 w-full py-3.5 rounded-full text-sm font-bold transition-all cursor-pointer",
                            isEnterprise
                              ? "bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.1]"
                              : "text-black font-bold"
                          )}
                          style={!isEnterprise ? {
                            background: 'linear-gradient(135deg, #ffd700, #f5c200, #e6b400)',
                            boxShadow: '0 2px 12px rgba(245,194,0,0.25)',
                          } : undefined}
                        >
                          {plan.cta}
                        </button>
                      </div>

                      {/* License info */}
                      <div className="px-6 pt-5 pb-2">
                        <p className="text-xs font-semibold text-white/60">{plan.license}</p>
                        <p className="text-[11px] text-white/30 mt-1 leading-relaxed">{plan.licenseDesc}</p>
                      </div>

                      {/* Features */}
                      <div className="px-6 pb-6 pt-2 flex-1">
                        <ul className="space-y-2.5">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400/80" />
                              <span className="text-[12px] leading-relaxed text-white/50">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Business features */}
                        {plan.businessFeatures.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-white/[0.05]">
                            <p className="text-xs font-semibold text-white/50 mb-2.5">
                              {plan.id === "agency" ? "" : "Business features:"}
                            </p>
                            <ul className="space-y-2">
                              {plan.businessFeatures.map((feature, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-[12px] leading-relaxed text-white/40">• {feature}</span>
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
                            openFaq === idx ? "bg-white/10 text-white" : "bg-white/[0.06] text-white/40"
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
