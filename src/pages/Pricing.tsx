import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/hooks/useSubscription";
import MainLayout from "@/components/layout/MainLayout";
import { Check, X, Sparkles, Crown, Info, Loader2, Monitor, Image as ImageIcon, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- PLANS DATA (Updated with correct credit economy) ---
const PLANS = [
  {
    id: "browser" as const,
    name: "Starter",
    price: 0,
    description: "Perfect for building your first store and selling products.",
    badge: null,
    badgeColor: "",
    accentGradient: "from-zinc-500 to-zinc-700",
    features: [
      { text: "Create & Customize Storefront", included: true },
      { text: "Sell Digital Products & Subs", included: true },
      { text: "Buy from Marketplace", included: true },
      { text: "Community Access", included: true },
      { text: "AI Website Builder", included: false },
      { text: "AI Image Generation", included: false },
      { text: "AI Video Generation", included: false },
      { text: "10% Transaction Fee", isNeutral: true },
    ],
    credits: 0,
  },
  {
    id: "creator" as const,
    name: "Creator",
    price: 69,
    description: "For serious sellers who need AI content creation tools.",
    badge: "Most Popular",
    badgeColor: "bg-gradient-to-r from-violet-500 to-fuchsia-500",
    accentGradient: "from-violet-500 to-fuchsia-500",
    features: [
      { text: "Everything in Starter", included: true },
      { text: "VibeCoder AI Builder (Claude 3.5)", included: true, highlight: true },
      { text: "Flux 1.1 Pro & Recraft V3 Images", included: true, highlight: true },
      { text: "Kling & Luma AI Video", included: true, highlight: true },
      { text: "Priority Support", included: true },
      { text: "Grey Verified Badge", included: true },
      { text: "5% Transaction Fee", isNeutral: true },
    ],
    credits: 2500,
  },
  {
    id: "agency" as const,
    name: "Agency",
    price: 199,
    description: "For power users, asset studios, and high-volume sellers.",
    badge: "Elite Status",
    badgeColor: "bg-gradient-to-r from-amber-400 to-orange-500",
    accentGradient: "from-amber-400 to-orange-500",
    features: [
      { text: "Everything in Creator", included: true },
      { text: "Highest Rate Limits", included: true },
      { text: "Dedicated Account Manager", included: true },
      { text: "Early Access to New Models", included: true },
      { text: "Gold Verified Badge", included: true, highlightColor: "text-amber-400" },
      { text: "0% Transaction Fees", highlightColor: "text-green-400" },
    ],
    credits: 12000,
  },
];

// --- FAQ DATA ---
const FAQS = [
  {
    q: "What AI models do you use?",
    a: "We use the absolute bleeding edge. Vibecoder is powered by Claude 3.5 Sonnet for code. Image generation uses Flux 1.1 Pro and Recraft V3. Video generation uses Kling AI and Luma Ray 2. We handle all the API costs."
  },
  {
    q: "How far do 12,000 credits go?",
    a: "A lot. That's enough for roughly 600 AI videos, OR 6,000 high-fidelity images, OR 4,000 code iterations. Most agencies can run their entire storefront design business on one subscription."
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

interface FeatureItemProps {
  feature: {
    text: string;
    included?: boolean;
    isNeutral?: boolean;
    highlight?: boolean;
    highlightColor?: string;
  };
}

function FeatureRow({ feature }: FeatureItemProps) {
  const isNegative = feature.included === false;
  const isNeutral = feature.isNeutral;
  
  return (
    <div className={`flex items-start gap-3 text-sm ${isNegative ? "opacity-50" : ""}`}>
      {isNegative ? (
        <X size={16} className="text-zinc-500 mt-0.5 shrink-0" />
      ) : isNeutral ? (
        <Info size={16} className="text-zinc-500 mt-0.5 shrink-0" />
      ) : (
        <Check size={16} className={`${feature.highlightColor || (feature.highlight ? "text-violet-400" : "text-green-400")} mt-0.5 shrink-0`} />
      )}
      <span className={feature.highlight ? "text-white font-medium" : isNegative ? "text-zinc-500" : "text-zinc-300"}>
        {feature.text}
      </span>
    </div>
  );
}

function ToolShowcase() {
  return (
    <div className="max-w-5xl mx-auto mb-20">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-white mb-2">Powering Next-Gen Intelligence</h2>
        <p className="text-zinc-400 text-sm">One subscription. Full access to the world's best AI models.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: CODE */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-violet-500/10 rounded-full flex items-center justify-center text-violet-400 mb-4">
            <Monitor size={24} />
          </div>
          <h3 className="font-bold text-white mb-1">VibeCoder Architect</h3>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-4">Claude 3.5 Sonnet • GPT-4o</p>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
             Generates complex React layouts, Tailwind styling, and full-stack logic. Smart enough to fix its own bugs.
          </p>
          <div className="mt-auto pt-4 border-t border-zinc-800 w-full flex justify-between items-center">
             <span className="text-xs text-zinc-500">Cost per msg</span>
             <span className="text-sm font-bold text-white">3 Credits</span>
          </div>
        </div>

        {/* CARD 2: IMAGE */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center text-pink-400 mb-4">
            <ImageIcon size={24} />
          </div>
          <h3 className="font-bold text-white mb-1">Visual Studio</h3>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-4">Flux 1.1 Pro • Recraft V3</p>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
             Create photorealistic product mockups, vector logos, and hero banners. Replaces Midjourney.
          </p>
          <div className="mt-auto pt-4 border-t border-zinc-800 w-full flex justify-between items-center">
             <span className="text-xs text-zinc-500">Cost per image</span>
             <span className="text-sm font-bold text-white">2 Credits</span>
          </div>
        </div>

        {/* CARD 3: VIDEO */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-400 mb-4">
            <Video size={24} />
          </div>
          <h3 className="font-bold text-white mb-1">Cinematic Video</h3>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-4">Kling AI • Luma Ray 2</p>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
             Generate high-fidelity motion backgrounds and product commercials. 4K resolution supported.
          </p>
          <div className="mt-auto pt-4 border-t border-zinc-800 w-full flex justify-between items-center">
             <span className="text-xs text-zinc-500">Cost per video</span>
             <span className="text-sm font-bold text-white">20 Credits</span>
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
        text: isCurrent ? "Current Plan" : "Start Building Free",
        style: "bg-zinc-800 hover:bg-zinc-700 text-white",
        disabled: isCurrent,
        isLink: true,
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
        style: "bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 text-white shadow-lg shadow-orange-900/20",
        disabled: isPurchasing,
      };
    }
    
    return {
      text: isPurchasing ? "Processing..." : "Subscribe Now",
      style: "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/20",
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
      <div className="min-h-screen bg-zinc-950 text-white pb-20 pt-24 px-4">
        
        {/* HERO */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            Unlock Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Creative Potential</span>
          </h1>
          <p className="text-zinc-400 text-lg">
            Start building for free. Upgrade to unlock the full power of the VibeCoder AI suite.
          </p>
        </div>

        {/* PRICING CARDS */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          
          {PLANS.map((planData) => {
            const buttonConfig = getButtonConfig(planData);
            const isCurrent = isCurrentPlan(planData.id);
            const isCreator = planData.id === 'creator';
            const isAgency = planData.id === 'agency';
            
            return (
              <motion.div 
                key={planData.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={cn(
                  "relative flex flex-col p-8 rounded-3xl border transition-all overflow-hidden",
                  isCreator 
                    ? "bg-zinc-900 border-violet-500/30 shadow-2xl shadow-violet-900/10 scale-105 z-10" 
                    : isAgency
                    ? "bg-zinc-900/50 border-zinc-800 hover:border-amber-500/30"
                    : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                )}
              >
                {/* TOP ACCENT BAR */}
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${planData.accentGradient}`} />
                
                {/* BADGE */}
                {planData.badge && !isCurrent && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-violet-500/20 text-violet-300 text-[10px] font-bold uppercase tracking-wider rounded-full border border-violet-500/30">
                    {planData.badge}
                  </div>
                )}

                {/* HEADER */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    {planData.name}
                    {isAgency && <Crown size={16} className="text-amber-400 fill-amber-400" />}
                  </h3>
                  <p className="text-sm text-zinc-400 h-10">{planData.description}</p>
                </div>

                {/* PRICE */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">${planData.price}</span>
                    <span className="text-zinc-500">/mo</span>
                  </div>
                  <div className={`mt-4 p-3 ${isCreator ? 'bg-zinc-950' : 'bg-zinc-900'} rounded-xl border border-zinc-800 flex items-center justify-between`}>
                    <span className="text-xs font-medium text-zinc-400">Monthly Credits</span>
                    <div className="flex items-center gap-2">
                      {planData.credits > 0 && (
                        isAgency 
                          ? <Crown size={14} className="text-amber-400" />
                          : <Sparkles size={14} className="text-violet-400" />
                      )}
                      <span className={`text-sm font-bold ${isAgency ? 'text-amber-400' : 'text-white'}`}>
                        {planData.credits.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* FEATURES */}
                <div className="space-y-4 mb-8 flex-1">
                  {planData.features.map((feature, idx) => (
                    <FeatureRow key={idx} feature={feature} />
                  ))}
                </div>

                {/* BUTTON */}
                {buttonConfig.isLink ? (
                  <Link 
                    to="/dashboard" 
                    className={cn(
                      "w-full py-3 rounded-xl font-bold text-sm transition-all text-center",
                      buttonConfig.style
                    )}
                  >
                    {buttonConfig.text}
                  </Link>
                ) : (
                  <button 
                    onClick={() => {
                      if (!buttonConfig.disabled) {
                        handleSubscribe(planData.id as 'creator' | 'agency');
                      }
                    }}
                    disabled={buttonConfig.disabled}
                    className={cn(
                      "w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                      buttonConfig.style
                    )}
                  >
                    {purchasing === planData.id && <Loader2 className="h-4 w-4 animate-spin" />}
                    {buttonConfig.text}
                  </button>
                )}

              </motion.div>
            );
          })}
        </div>

        {/* MODEL COSTS BREAKDOWN */}
        <ToolShowcase />

        {/* FAQ SECTION */}
        <div className="max-w-3xl mx-auto mt-20">
          <h2 className="text-2xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-900/70 transition-colors"
                >
                  <span className="font-medium text-white">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: openFaq === idx ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-zinc-400"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
                      <div className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed">
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
