import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/hooks/useSubscription";
import MainLayout from "@/components/layout/MainLayout";
import { Check, X, Sparkles, Crown, Info, Loader2, Monitor, Image as ImageIcon, Video, ArrowRight, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- PLANS DATA ---
const PLANS = [
  {
    id: "starter" as const,
    name: "Starter",
    price: 0,
    description: "Build your store manually. No AI features.",
    badge: null,
    badgeColor: "",
    accentGradient: "from-zinc-500 to-zinc-700",
    features: [
      { text: "Create & Customize Storefront", included: true },
      { text: "Sell Digital Products & Subs", included: true },
      { text: "Buy from Marketplace", included: true },
      { text: "Community Access", included: true },
      { text: "VibeCoder AI Builder", included: false },
      { text: "AI Image Generation", included: false },
      { text: "AI Video Generation", included: false },
      { text: "10% Transaction Fee", isNeutral: true },
    ],
    credits: 0,
    modelTier: null,
  },
  {
    id: "basic" as const,
    name: "Basic",
    price: 25,
    description: "Get started with AI-powered building.",
    badge: null,
    badgeColor: "",
    accentGradient: "from-blue-500 to-cyan-500",
    features: [
      { text: "Everything in Starter", included: true },
      { text: "VibeCoder (Flash Models)", included: true, highlight: true },
      { text: "500 Monthly Credits", included: true },
      { text: "Manual Model Selection", included: true },
      { text: "Pro Models (GPT-5, Gemini Pro)", included: false },
      { text: "Image & Video Generation", included: false },
      { text: "8% Transaction Fee", isNeutral: true },
    ],
    credits: 500,
    modelTier: 'flash',
  },
  {
    id: "creator" as const,
    name: "Creator",
    price: 100,
    description: "Full AI suite for serious creators.",
    badge: "Most Popular",
    badgeColor: "bg-gradient-to-r from-violet-500 to-fuchsia-500",
    accentGradient: "from-violet-500 to-fuchsia-500",
    features: [
      { text: "Everything in Basic", included: true },
      { text: "Pro Models (GPT-5, Gemini 3 Pro)", included: true, highlight: true },
      { text: "AI Image Generation", included: true, highlight: true },
      { text: "Auto-Model Selection", included: true },
      { text: "2,500 Monthly Credits", included: true },
      { text: "Grey Verified Badge", included: true },
      { text: "5% Transaction Fee", isNeutral: true },
    ],
    credits: 2500,
    modelTier: 'pro',
  },
  {
    id: "agency" as const,
    name: "Agency",
    price: 200,
    description: "Maximum power for studios and agencies.",
    badge: "Elite Status",
    badgeColor: "bg-gradient-to-r from-amber-400 to-orange-500",
    accentGradient: "from-amber-400 to-orange-500",
    features: [
      { text: "Everything in Creator", included: true },
      { text: "Flagship Models (GPT-5.2)", included: true, highlight: true },
      { text: "AI Video Generation", included: true, highlight: true },
      { text: "Full Auto-Model Access", included: true },
      { text: "6,000 Monthly Credits", included: true },
      { text: "Priority Processing", included: true },
      { text: "Gold Verified Badge", included: true, highlightColor: "text-amber-400" },
      { text: "0% Transaction Fees", highlightColor: "text-green-400" },
    ],
    credits: 6000,
    modelTier: 'flagship',
  },
];

const FAQS = [
  {
    q: "What AI models do you use?",
    a: "We use the absolute bleeding edge. Vibecoder is powered by Claude 3.5 Sonnet for code. Image generation uses Flux 1.1 Pro and Recraft V3. Video generation uses Kling AI and Luma Ray 2. We handle all the API costs."
  },
  {
    q: "How far do 6,000 credits go?",
    a: "A lot. That's enough for roughly 300 AI videos, OR 3,000 high-fidelity images, OR 2,000 code iterations. Most agencies can run their entire storefront design business on one subscription."
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Your credits remain active until the end of your billing cycle. If you downgrade to Free, your storefront remains live, but you lose the ability to use AI tools to edit it."
  },
  {
    q: "What is the 0% Fee structure?",
    a: "On the Agency plan, SellsPay takes $0 from your sales. You keep 100% of your revenue (minus standard Stripe processing fees). This alone pays for the subscription if you sell over $2,000/mo."
  }
];

// --- COMPONENTS ---

function FeatureRow({ feature }: { feature: { text: string; included?: boolean; isNeutral?: boolean; highlight?: boolean; highlightColor?: string } }) {
  const isNegative = feature.included === false;
  const isNeutral = feature.isNeutral;

  return (
    <div className={cn("flex items-start gap-3 py-1", isNegative && "opacity-40")}>
      {isNegative ? (
        <X size={15} className="text-zinc-600 mt-0.5 shrink-0" />
      ) : isNeutral ? (
        <Info size={15} className="text-zinc-500 mt-0.5 shrink-0" />
      ) : (
        <Check size={15} className={cn(
          "mt-0.5 shrink-0",
          feature.highlightColor || (feature.highlight ? "text-primary" : "text-emerald-400")
        )} />
      )}
      <span className={cn(
        "text-[13px] leading-snug",
        feature.highlight ? "text-white font-medium" : isNegative ? "text-zinc-600" : "text-zinc-400"
      )}>
        {feature.text}
      </span>
    </div>
  );
}

function ToolShowcase() {
  const tools = [
    {
      icon: Monitor,
      name: "VibeCoder Architect",
      models: "Claude 3.5 Sonnet · GPT-4o",
      desc: "Generates complex React layouts, Tailwind styling, and full-stack logic. Smart enough to fix its own bugs.",
      color: "text-primary",
      bg: "bg-primary/10",
      cost: "3",
      unit: "per message",
    },
    {
      icon: ImageIcon,
      name: "Visual Studio",
      models: "Flux 1.1 Pro · Recraft V3",
      desc: "Create photorealistic product mockups, vector logos, and hero banners. Replaces Midjourney.",
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      cost: "2",
      unit: "per image",
    },
    {
      icon: Video,
      name: "Cinematic Video",
      models: "Kling AI · Luma Ray 2",
      desc: "Generate high-fidelity motion backgrounds and product commercials. 4K resolution supported.",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      cost: "20",
      unit: "per video",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto mb-24">
      <div className="text-center mb-12">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary/70 mb-3">Built-in Intelligence</p>
        <h2 className="text-3xl font-bold text-white">One subscription. Three powerhouses.</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {tools.map((tool) => (
          <div key={tool.name} className="group bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-2xl hover:border-zinc-700 transition-all duration-300">
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-5", tool.bg)}>
              <tool.icon size={20} className={tool.color} />
            </div>
            <h3 className="font-bold text-white text-base mb-1">{tool.name}</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4 font-medium">{tool.models}</p>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">{tool.desc}</p>
            <div className="pt-4 border-t border-zinc-800/60 flex justify-between items-center">
              <span className="text-[11px] text-zinc-500 font-medium">{tool.unit}</span>
              <span className="text-sm font-bold text-white">{tool.cost} Credits</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { plan, startCheckout, loading } = useSubscription();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubscribe = async (tierId: 'basic' | 'creator' | 'agency') => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      navigate("/login");
      return;
    }
    setPurchasing(tierId);
    try {
      const result = await startCheckout(tierId);
      if (result?.error) toast.error(result.error);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout");
    } finally {
      setPurchasing(null);
    }
  };

  const isCurrentPlan = (tierId: string) => plan === tierId || (plan === 'browser' && tierId === 'starter');

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background text-white pb-24 pt-28 px-4 sm:px-6">

        {/* ─── HERO ─── */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-6">
              <Zap size={12} className="text-primary" />
              <span className="text-xs font-medium text-primary/80 tracking-wide">Simple, transparent pricing</span>
            </div>
            <h1 className="text-4xl md:text-[3.25rem] font-extrabold tracking-tight leading-[1.1] mb-5">
              Build faster with
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-400 to-fuchsia-400">AI-powered tools</span>
            </h1>
            <p className="text-zinc-400 text-base md:text-lg max-w-lg mx-auto leading-relaxed">
              Start free. Scale when you're ready. Every plan includes your own storefront and marketplace access.
            </p>
          </motion.div>
        </div>

        {/* ─── PRICING CARDS ─── */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-28">
          {PLANS.map((planData, i) => {
            const isCurrent = isCurrentPlan(planData.id);
            const isCreator = planData.id === 'creator';
            const isAgency = planData.id === 'agency';
            const isPurchasing = purchasing === planData.id;

            return (
              <motion.div
                key={planData.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className={cn(
                  "relative flex flex-col rounded-2xl border transition-all duration-300 overflow-hidden",
                  isCreator
                    ? "bg-zinc-900/80 border-primary/30 ring-1 ring-primary/10 shadow-[0_0_60px_-15px] shadow-primary/15 lg:scale-[1.03] z-10"
                    : isAgency
                      ? "bg-zinc-900/50 border-zinc-800 hover:border-amber-500/25"
                      : "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700"
                )}
              >
                {/* Accent line */}
                <div className={cn("h-px bg-gradient-to-r", planData.accentGradient)} />

                {/* Badge */}
                {planData.badge && !isCurrent && (
                  <div className={cn(
                    "absolute top-5 right-5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border",
                    isAgency
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                      : "bg-primary/10 text-primary border-primary/25"
                  )}>
                    {planData.badge}
                  </div>
                )}

                <div className="p-7 flex flex-col flex-1">
                  {/* Header */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                      {planData.name}
                      {isAgency && <Crown size={15} className="text-amber-400" />}
                    </h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{planData.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[2.5rem] font-extrabold tracking-tight text-white leading-none">${planData.price}</span>
                      <span className="text-sm text-zinc-500 font-medium">/mo</span>
                    </div>

                    {planData.credits > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        {isAgency
                          ? <Crown size={13} className="text-amber-400" />
                          : <Sparkles size={13} className="text-primary/70" />
                        }
                        <span className={cn(
                          "text-xs font-semibold",
                          isAgency ? "text-amber-400/80" : "text-zinc-400"
                        )}>
                          {planData.credits.toLocaleString()} credits/month
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-zinc-800/60 mb-5" />

                  {/* Features */}
                  <div className="space-y-2 mb-7 flex-1">
                    {planData.features.map((feature, idx) => (
                      <FeatureRow key={idx} feature={feature} />
                    ))}
                  </div>

                  {/* CTA */}
                  {planData.id === 'starter' ? (
                    isCurrent ? (
                      <div className="w-full py-2.5 rounded-xl text-sm font-medium text-center text-zinc-500 border border-zinc-800 bg-zinc-900/50">
                        Current Plan
                      </div>
                    ) : (
                      <Link
                        to="/dashboard"
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-center text-zinc-300 border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                      >
                        Start Free <ArrowRight size={14} />
                      </Link>
                    )
                  ) : isCurrent ? (
                    <div className="w-full py-2.5 rounded-xl text-sm font-medium text-center text-emerald-400 border border-emerald-500/25 bg-emerald-500/10">
                      Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(planData.id as 'basic' | 'creator' | 'agency')}
                      disabled={isPurchasing}
                      className={cn(
                        "w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2",
                        isAgency
                          ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-white"
                          : isCreator
                            ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                            : "bg-zinc-100 hover:bg-white text-zinc-900"
                      )}
                    >
                      {isPurchasing && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isPurchasing ? "Processing..." : isAgency ? "Go Elite" : "Subscribe"}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ─── TOOL SHOWCASE ─── */}
        <ToolShowcase />

        {/* ─── FAQ ─── */}
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3">Support</p>
            <h2 className="text-2xl font-bold text-white">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="border border-zinc-800/60 rounded-xl overflow-hidden bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-white text-sm">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: openFaq === idx ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-zinc-500 ml-4 shrink-0"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
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
                      <div className="px-5 pb-5 text-[13px] text-zinc-400 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
