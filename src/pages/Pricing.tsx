import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/hooks/useSubscription";
import MainLayout from "@/components/layout/MainLayout";
import { Check, X, Sparkles, Zap, Shield, ChevronDown, ChevronUp, Image as ImageIcon, Video, Loader2, Code2, Palette, Film } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- PLANS DATA ---
const PLANS = [
  {
    id: "browser" as const,
    name: "Browser",
    price: 0,
    description: "Browse the marketplace and buy products.",
    badge: null,
    badgeColor: "",
    features: [
      { text: "Browse all products", included: true },
      { text: "Purchase from creators", included: true },
      { text: "Vibecoder AI Builder", included: false },
      { text: "AI Image Generation", included: false },
      { text: "AI Video Generation", included: false },
      { text: "Transaction Fees", value: "10%" },
    ],
    credits: 0,
  },
  {
    id: "creator" as const,
    name: "Creator",
    price: 69,
    description: "For serious digital product sellers.",
    badge: "Most Popular",
    badgeColor: "bg-gradient-to-r from-violet-500 to-fuchsia-500",
    features: [
      { text: "Vibecoder AI Builder", included: true, detail: "Unlimited Projects" },
      { text: "AI Image Generation", included: true, detail: "Flux Pro Model" },
      { text: "AI Video Generation", included: false },
      { text: "Transaction Fees", value: "5%", highlight: true },
      { text: "Grey Verified Badge", included: true },
      { text: "Priority Support", included: true },
    ],
    credits: 2500,
  },
  {
    id: "agency" as const,
    name: "Agency",
    price: 199,
    description: "For power users & asset studios.",
    badge: "Elite Status",
    badgeColor: "bg-gradient-to-r from-amber-400 to-orange-500",
    features: [
      { text: "Vibecoder AI Builder", included: true, detail: "Priority GPU Access" },
      { text: "AI Image Generation", included: true, detail: "Flux Pro (Fast)" },
      { text: "AI Video Generation", included: true, detail: "Luma Ray 2 (4K)" },
      { text: "Transaction Fees", value: "0%", highlight: true },
      { text: "Gold Verified Badge", included: true },
      { text: "Dedicated Manager", included: true },
    ],
    credits: 12000,
  },
];

// --- FAQ DATA ---
const FAQS = [
  {
    q: "What AI models do you use?",
    a: "We use the absolute bleeding edge. Vibecoder is powered by Google Gemini 2.0 Flash for code. Image generation uses Black Forest Labs' Flux Pro. Video generation uses Luma Dream Machine (Ray 2). We handle all the API costs."
  },
  {
    q: "How far do 12,000 credits go?",
    a: "A lot. That's enough for roughly 24 Cinematic 4K Videos, OR 120 High-Fidelity Images, OR 480 Code Iterations. Most agencies can run their entire storefront design business on one subscription."
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

function FeatureRow({ feature }: { feature: { text: string; included?: boolean; value?: string; highlight?: boolean; detail?: string } }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-zinc-800/50 last:border-0">
      {feature.included === false ? (
        <X size={18} className="text-zinc-600 shrink-0 mt-0.5" />
      ) : feature.included === true ? (
        <Check size={18} className="text-green-400 shrink-0 mt-0.5" />
      ) : (
        <span className={cn("text-sm font-bold", feature.highlight ? "text-green-400" : "text-zinc-200")}>
          {feature.value}
        </span>
      )}
      <div className="flex flex-col">
        <span className={cn("text-sm", feature.included === false ? "text-zinc-500" : "text-zinc-200")}>
          {feature.text}
        </span>
        {feature.detail && (
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wide">
            {feature.detail}
          </span>
        )}
      </div>
    </div>
  );
}

function ToolShowcase() {
  return (
    <div className="w-full max-w-7xl mx-auto mt-32 mb-32">
      
      {/* SECTION HEADER */}
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Next-Gen Intelligence</span>
        </h2>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Your subscription unlocks a suite of the world's most powerful AI models, fully integrated into your workflow. No separate subscriptions required.
        </p>
      </div>

      {/* TOOLS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: VIBECODER */}
        <div className="group relative p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-sm hover:bg-zinc-900/60 transition-all overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Code2 size={120} />
          </div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-6 text-violet-400">
              <Sparkles size={24} />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-1">Vibecoder Architect</h3>
            <p className="text-xs font-mono text-violet-400 mb-4">MODEL: GEMINI 2.0 FLASH</p>
            
            <p className="text-sm text-zinc-400 leading-relaxed mb-8 min-h-[60px]">
              The core brain. Generates complex React layouts, handles Tailwind styling, and structures your entire storefront in real-time.
            </p>

            {/* Credit Pill */}
            <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
               <span className="text-xs text-zinc-500">Cost per generation</span>
               <span className="text-sm font-bold text-white">25 Credits</span>
            </div>
          </div>
        </div>

        {/* CARD 2: IMAGE STUDIO */}
        <div className="group relative p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-sm hover:bg-zinc-900/60 transition-all overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Palette size={120} />
          </div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 flex items-center justify-center mb-6 text-fuchsia-400">
              <ImageIcon size={24} />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-1">Visual Studio</h3>
            <p className="text-xs font-mono text-fuchsia-400 mb-4">MODEL: BLACK FOREST FLUX PRO</p>
            
            <p className="text-sm text-zinc-400 leading-relaxed mb-8 min-h-[60px]">
              Create high-fidelity brand assets, product mockups, and hero banners. Replaces the need for Midjourney or stock photos.
            </p>

             {/* Credit Pill */}
             <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
               <span className="text-xs text-zinc-500">Cost per generation</span>
               <span className="text-sm font-bold text-white">100 Credits</span>
            </div>
          </div>
        </div>

        {/* CARD 3: CINEMATIC VIDEO */}
        <div className="group relative p-8 rounded-3xl bg-zinc-900/40 border border-amber-500/20 backdrop-blur-sm hover:bg-zinc-900/60 transition-all overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Film size={120} className="text-amber-500" />
          </div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-6 text-amber-400">
              <Video size={24} />
            </div>
            
            <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-white">Cinematic Video</h3>
                <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">AGENCY</span>
            </div>
            <p className="text-xs font-mono text-amber-400 mb-4">MODEL: LUMA RAY 2</p>
            
            <p className="text-sm text-zinc-400 leading-relaxed mb-8 min-h-[60px]">
              Generate 4K motion backgrounds and product reveals. Create an immersive "Apple-style" website feel instantly.
            </p>

             {/* Credit Pill */}
             <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
               <span className="text-xs text-zinc-500">Cost per generation</span>
               <span className="text-sm font-bold text-white">500 Credits</span>
            </div>
          </div>
        </div>

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

  const handleSubscribe = async (tierId: 'creator' | 'agency') => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      navigate("/login");
      return;
    }

    setPurchasing(tierId);
    try {
      const result = await startCheckout(tierId);
      
      if (result?.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout");
    } finally {
      setPurchasing(null);
    }
  };

  const isCurrentPlan = (tierId: string) => plan === tierId;

  const getButtonConfig = (planData: typeof PLANS[number]) => {
    const isCurrent = isCurrentPlan(planData.id);
    const isPurchasing = purchasing === planData.id;
    
    if (planData.id === 'browser') {
      return {
        text: isCurrent ? "Current Plan" : "Free Forever",
        style: "bg-zinc-800 text-zinc-400 cursor-default",
        disabled: true,
      };
    }
    
    if (isCurrent) {
      return {
        text: "Current Plan",
        style: "bg-green-500/20 text-green-400 border border-green-500/30 cursor-default",
        disabled: true,
      };
    }
    
    if (planData.id === 'agency') {
      return {
        text: isPurchasing ? "Processing..." : "Go Elite",
        style: "bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-bold shadow-lg shadow-amber-500/25",
        disabled: isPurchasing,
      };
    }
    
    return {
      text: isPurchasing ? "Processing..." : "Subscribe",
      style: "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25",
      disabled: isPurchasing,
    };
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-zinc-950 text-white py-20 px-4 font-sans selection:bg-violet-500/30">
        
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            Unlock Your Creative Potential
          </h1>
          <p className="text-zinc-400 text-lg">
            Choose the plan that fits your scale. Cancel anytime.
          </p>
        </div>

        {/* PRICING CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto relative z-10">
          
          {/* Glow Effects behind cards */}
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[128px] -z-10" />
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[128px] -z-10" />

          {PLANS.map((planData) => {
            const buttonConfig = getButtonConfig(planData);
            const isCurrent = isCurrentPlan(planData.id);
            
            return (
              <motion.div 
                key={planData.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -8 }}
                className={cn(
                  "relative flex flex-col p-8 rounded-3xl border backdrop-blur-xl transition-all duration-300",
                  planData.id === 'agency' 
                    ? "bg-zinc-900/60 border-amber-500/30 shadow-2xl shadow-amber-900/10" 
                    : planData.id === 'creator'
                    ? "bg-zinc-900/60 border-violet-500/30 shadow-2xl shadow-violet-900/10"
                    : "bg-zinc-900/40 border-zinc-800",
                  isCurrent && "ring-2 ring-green-500/50"
                )}
              >
                {/* BADGE */}
                {planData.badge && !isCurrent && (
                  <div className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg",
                    planData.badgeColor
                  )}>
                    {planData.badge}
                  </div>
                )}
                
                {/* Current Plan Badge */}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg bg-gradient-to-r from-green-500 to-emerald-500">
                    Your Plan
                  </div>
                )}

                {/* HEADER */}
                <div className="mb-8 pt-2">
                  <h3 className="text-xl font-bold text-white mb-2">{planData.name}</h3>
                  <p className="text-sm text-zinc-400 h-10">{planData.description}</p>
                </div>

                {/* PRICE */}
                <div className="mb-8 flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">${planData.price}</span>
                  <span className="text-zinc-500 mb-1">/ mo</span>
                </div>

                {/* CREDITS */}
                <div className="mb-8 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-zinc-400">MONTHLY CREDITS</span>
                    <span className={cn(
                      "text-xs font-bold",
                      planData.id === 'agency' ? 'text-amber-400' : 'text-white'
                    )}>
                      {planData.credits.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(planData.credits / 12000) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={cn("h-full rounded-full", planData.badgeColor || 'bg-zinc-600')}
                    />
                  </div>
                </div>

                {/* FEATURES */}
                <div className="flex-1 space-y-2 mb-8">
                  {planData.features.map((feature, idx) => (
                    <FeatureRow key={idx} feature={feature} />
                  ))}
                </div>

                {/* BUTTON */}
                <button 
                  onClick={() => {
                    if (planData.id !== 'browser' && !isCurrent) {
                      handleSubscribe(planData.id as 'creator' | 'agency');
                    }
                  }}
                  disabled={buttonConfig.disabled}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                    buttonConfig.style
                  )}
                >
                  {purchasing === planData.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  {buttonConfig.text}
                </button>

              </motion.div>
            );
          })}
        </div>

        {/* SPECS & BREAKDOWN */}
        <ToolShowcase />

        {/* FAQ SECTION */}
        <div className="max-w-3xl mx-auto mt-32">
          <h2 className="text-2xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden hover:bg-zinc-900/50 transition-colors"
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-medium text-zinc-200">{faq.q}</span>
                  {openFaq === idx ? <ChevronUp className="text-zinc-500" /> : <ChevronDown className="text-zinc-500" />}
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 text-sm text-zinc-400 leading-relaxed"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER NOTE */}
        <div className="text-center mt-20 text-zinc-600 text-sm">
          <p>Prices in USD. Cancel anytime via the dashboard.</p>
          <div className="flex justify-center gap-4 mt-4">
            <span className="flex items-center gap-1"><Shield size={12} /> Secure Payment</span>
            <span className="flex items-center gap-1"><Zap size={12} /> Instant Access</span>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
