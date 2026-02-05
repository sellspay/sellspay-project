import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import MainLayout from "@/components/layout/MainLayout";
import { Check, Loader2, Sparkles, Crown, Percent, Zap, Image, Video, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Tier definitions with the new 3-tier system
const TIER_CONFIG = {
  browser: {
    id: "browser",
    name: "Browser",
    description: "Browse the marketplace for free",
    price: 0,
    yearlyPrice: 0,
    credits: 0,
    sellerFee: 10,
    badge: "none",
    color: "from-zinc-500/20 to-zinc-600/20",
    borderColor: "border-zinc-500/30",
    iconColor: "text-zinc-400",
    popular: false,
    features: [
      "Browse all products",
      "Purchase from creators",
      "Free audio tools",
      "Community access",
    ],
    capabilities: {
      vibecoder: false,
      imageGen: false,
      videoGen: false,
    },
  },
  creator: {
    id: "creator",
    name: "Creator",
    description: "For serious creators and sellers",
    price: 69,
    yearlyPrice: 690,
    credits: 2500,
    sellerFee: 5,
    badge: "grey",
    color: "from-primary/20 to-purple-500/20",
    borderColor: "border-primary/50",
    iconColor: "text-primary",
    popular: true,
    features: [
      "2,500 credits/month",
      "Vibecoder AI Builder",
      "AI Image Generation",
      "5% seller fee (save 5%)",
      "Grey verified badge",
      "Priority support",
    ],
    capabilities: {
      vibecoder: true,
      imageGen: true,
      videoGen: false,
    },
  },
  agency: {
    id: "agency",
    name: "Agency",
    description: "For power users and teams",
    price: 199,
    yearlyPrice: 1990,
    credits: 12000,
    sellerFee: 0,
    badge: "gold",
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/30",
    iconColor: "text-amber-400",
    popular: false,
    features: [
      "12,000 credits/month",
      "Everything in Creator, plus:",
      "AI Video Generation",
      "0% seller fee (save 10%)",
      "Gold verified badge",
      "Dedicated support",
      "Team features (coming soon)",
    ],
    capabilities: {
      vibecoder: true,
      imageGen: true,
      videoGen: true,
    },
  },
};

const faqs = [
  {
    question: "What are credits used for?",
    answer: "Credits power AI features: Vibecoder (25 credits), Image Generation (100 credits), and Video Generation (500 credits). Free tools like Audio Converter don't require credits."
  },
  {
    question: "Do credits expire?",
    answer: "Credits reset each month with your subscription. Unused credits don't roll over to the next month, so make sure to use them!"
  },
  {
    question: "How do seller fee reductions work?",
    answer: "When you subscribe to Creator or Agency, your platform fee on product sales drops from 10% to 5% (Creator) or 0% (Agency). This means more money in your pocket on every sale!"
  },
  {
    question: "What's the difference between Creator and Agency?",
    answer: "Agency includes Video Generation AI, 12,000 credits (vs 2,500), zero seller fees, and a prestigious gold badge. It's designed for professional creators and teams."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes! You can cancel your subscription at any time from Settings → Billing. You'll keep your credits and reduced seller fees until the end of your billing period."
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { plan, startCheckout, loading } = useSubscription();
  const [purchasing, setPurchasing] = useState<string | null>(null);

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

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/20 mb-6">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Platform Plans
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Choose Your <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">Plan</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Unlock AI tools, reduce seller fees, and scale your creative business.
            </p>
          </div>

          {/* Seller Fee Benefit Banner */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-green-500/5 to-transparent border border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Percent className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-400">Seller Fee Reduction</p>
                  <p className="text-sm text-muted-foreground">
                    Creator members pay only 5% fees on sales. Agency pays 0%. Keep more of what you earn!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {Object.values(TIER_CONFIG).map((tierConfig) => {
              const isCurrent = isCurrentPlan(tierConfig.id);
              const canUpgrade = tierConfig.id !== 'browser' && !isCurrent && plan !== 'agency';
              
              return (
                <div
                  key={tierConfig.id}
                  className={cn(
                    "relative flex flex-col rounded-2xl border bg-card/50 backdrop-blur-sm p-6",
                    tierConfig.popular ? "border-primary/50 shadow-lg shadow-primary/10" : "border-border/50",
                    isCurrent && "ring-2 ring-green-500/50"
                  )}
                >
                  {/* Popular badge */}
                  {tierConfig.popular && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="px-4 py-1 rounded-full bg-gradient-to-r from-primary to-purple-500 text-xs font-bold text-white">
                        MOST POPULAR
                      </div>
                    </div>
                  )}
                  
                  {/* Current Plan badge */}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="px-4 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-xs font-bold text-white">
                        YOUR PLAN
                      </div>
                    </div>
                  )}

                  {/* Tier header */}
                  <div className="mb-6 pt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold">{tierConfig.name}</h3>
                      {tierConfig.sellerFee === 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          0% fees
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {tierConfig.description}
                    </p>
                  </div>

                  {/* Price display */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className={cn(
                        "text-4xl font-bold",
                        tierConfig.popular && "bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent"
                      )}>
                        ${tierConfig.price}
                      </span>
                      <span className="text-muted-foreground">
                        {tierConfig.price > 0 ? "per month" : "forever"}
                      </span>
                    </div>
                    {tierConfig.credits > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {tierConfig.credits.toLocaleString()} credits/month
                      </p>
                    )}
                  </div>

                  {/* AI Capabilities */}
                  <div className="flex gap-2 mb-4">
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                      tierConfig.capabilities.vibecoder 
                        ? "bg-primary/20 text-primary" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      <Wand2 className="w-3 h-3" />
                      Vibecoder
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                      tierConfig.capabilities.imageGen 
                        ? "bg-primary/20 text-primary" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      <Image className="w-3 h-3" />
                      Image
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                      tierConfig.capabilities.videoGen 
                        ? "bg-amber-500/20 text-amber-400" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      <Video className="w-3 h-3" />
                      Video
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    className={cn(
                      "w-full mb-6",
                      tierConfig.popular && !isCurrent
                        ? "bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white"
                        : isCurrent
                          ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-default"
                          : tierConfig.id === 'browser'
                            ? "bg-secondary hover:bg-secondary/80"
                            : "bg-secondary hover:bg-secondary/80"
                    )}
                    onClick={() => {
                      if (tierConfig.id === 'browser') return;
                      if (!isCurrent && canUpgrade) {
                        handleSubscribe(tierConfig.id as 'creator' | 'agency');
                      }
                    }}
                    disabled={purchasing === tierConfig.id || isCurrent || tierConfig.id === 'browser'}
                  >
                    {purchasing === tierConfig.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : isCurrent ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Current Plan
                      </>
                    ) : tierConfig.id === 'browser' ? (
                      "Free Forever"
                    ) : plan !== 'browser' ? (
                      "Upgrade"
                    ) : (
                      "Subscribe"
                    )}
                  </Button>

                  {/* Features list */}
                  <div className="flex-1">
                    <ul className="space-y-3">
                      {tierConfig.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className={cn("h-4 w-4 mt-0.5 shrink-0", tierConfig.iconColor)} />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Credit Cost Info */}
          <div className="text-center mb-16">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 px-6 py-4 rounded-xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                <span className="text-sm">Vibecoder: 25 credits</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-primary" />
                <span className="text-sm">Image Gen: 100 credits</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-amber-400" />
                <span className="text-sm">Video Gen: 500 credits</span>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div>
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="max-w-2xl mx-auto">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-border/50">
                  <AccordionTrigger className="text-left hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
