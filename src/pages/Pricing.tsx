import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import MainLayout from "@/components/layout/MainLayout";
import { Check, Loader2, Sparkles, Crown, Percent, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SubscriptionTier {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
}

// Tier definitions with seller fee benefits
const TIER_CONFIG = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "Perfect for trying out our AI audio tools",
    sellerFee: 5,
    sellerFeeLabel: null,
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-400",
    popular: false,
    features: [
      "60 credits/month",
      "All Pro AI tools access",
      "Voice Isolator & Music Splitter",
      "SFX Generator",
      "Priority processing",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "For serious creators and sellers",
    sellerFee: 3,
    sellerFeeLabel: "3% seller fee (Save 2%)",
    color: "from-primary/20 to-purple-500/20",
    borderColor: "border-primary/50",
    iconColor: "text-primary",
    popular: true,
    features: [
      "150 credits/month",
      "Everything in Starter, plus:",
      "Reduced 3% seller fee",
      "Priority support",
      "Early access to new tools",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "For power users and teams",
    sellerFee: 0,
    sellerFeeLabel: "0% seller fee (Save 5%)",
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/30",
    iconColor: "text-amber-400",
    popular: false,
    features: [
      "300 credits/month",
      "Everything in Pro, plus:",
      "Zero seller fees",
      "Dedicated support",
      "Custom integrations",
      "Team features (coming soon)",
    ],
  },
};

const faqs = [
  {
    question: "What are credits used for?",
    answer: "Credits are used to access Pro AI audio tools. Each tool usage costs 1 credit. Free tools like Audio Converter, Audio Joiner, and Audio Cutter don't require credits."
  },
  {
    question: "Do credits expire?",
    answer: "Credits reset each month with your subscription. Unused credits don't roll over to the next month, so make sure to use them!"
  },
  {
    question: "How do seller fee reductions work?",
    answer: "When you subscribe to Pro or Enterprise, your platform fee on product sales drops from 5% to 3% (Pro) or 0% (Enterprise). This means more money in your pocket on every sale!"
  },
  {
    question: "Can I top up credits?",
    answer: "Yes! You can purchase additional credits anytime by clicking your wallet in the header. Top-up credits are priced at a premium, so upgrading your plan is usually the better value."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes! You can cancel your subscription at any time from Settings → Billing. You'll keep your credits and reduced seller fees until the end of your billing period."
  },
  {
    question: "Do new users get free credits?",
    answer: "Yes! Every new user receives 3 free credits to try out our Pro tools. No credit card required."
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { startCheckout, verifyPurchase, subscription, checkSubscription } = useCredits();
  
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchTiers();
    
    const sessionId = searchParams.get("session_id");
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    
    if (success === "true" && sessionId) {
      verifyPurchase(sessionId).then(() => {
        toast.success("Subscription activated! Credits added to your wallet.");
        navigate("/pricing", { replace: true });
      });
    } else if (canceled === "true") {
      toast.info("Subscription canceled. No charges were made.");
      navigate("/pricing", { replace: true });
    }
  }, [searchParams]);

  const fetchTiers = async () => {
    try {
      const { data, error } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setTiers(data || []);
    } catch (error) {
      console.error("Error fetching tiers:", error);
      toast.error("Failed to load pricing");
    } finally {
      setLoading(false);
    }
  };

  const getTierData = (tierName: string) => {
    return tiers.find(t => t.name.toLowerCase() === tierName.toLowerCase());
  };

  const handleSubscribe = async (tierId: string) => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      navigate("/login");
      return;
    }

    const tierData = getTierData(tierId);
    if (!tierData || !tierData.stripe_price_id) {
      toast.error("This plan is not available");
      return;
    }

    setPurchasing(tierId);
    try {
      const result = await startCheckout(tierData.id, tierData.stripe_price_id);
      
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      
      if (result?.upgraded) {
        toast.success(result.message || "Subscription upgraded successfully!");
        await checkSubscription(true);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout");
    } finally {
      setPurchasing(null);
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const getCurrentTier = (): string | null => {
    if (!subscription) return null;
    // Match subscription credits to tier
    const tier = tiers.find(t => t.credits === subscription.credits);
    return tier?.name.toLowerCase() || null;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  const currentTier = getCurrentTier();

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
                    Pro members pay only 3% fees on sales. Enterprise pays 0%. Keep more of what you earn!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Subscription Notice */}
          {subscription && (
            <div className="max-w-md mx-auto mb-8">
              <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-400 capitalize">
                      Active: {currentTier || "Subscription"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {subscription.credits} credits/month • Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {Object.values(TIER_CONFIG).map((tierConfig) => {
              const tierData = getTierData(tierConfig.id);
              const isCurrentPlan = currentTier === tierConfig.id;
              const canUpgrade = subscription && tierData && tierData.price_cents > subscription.priceAmount;
              const isDowngrade = subscription && tierData && tierData.price_cents < subscription.priceAmount;
              
              return (
                <div
                  key={tierConfig.id}
                  className={cn(
                    "relative flex flex-col rounded-2xl border bg-card/50 backdrop-blur-sm p-6",
                    tierConfig.popular ? "border-primary/50 shadow-lg shadow-primary/10" : "border-border/50",
                    isCurrentPlan && "ring-2 ring-green-500/50"
                  )}
                >
                  {/* Popular badge */}
                  {tierConfig.popular && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="px-4 py-1 rounded-full bg-gradient-to-r from-primary to-purple-500 text-xs font-bold text-white">
                        MOST POPULAR
                      </div>
                    </div>
                  )}
                  
                  {/* Current Plan badge */}
                  {isCurrentPlan && (
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
                        ${tierData ? formatPrice(tierData.price_cents) : "—"}
                      </span>
                      <span className="text-muted-foreground">per month</span>
                    </div>
                    {tierData && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ~${(tierData.price_cents / tierData.credits / 100).toFixed(2)}/credit
                      </p>
                    )}
                  </div>

                  {/* Seller Fee Highlight - Only show for Pro/Enterprise */}
                  {tierConfig.sellerFeeLabel && (
                    <div className={cn(
                      "p-3 rounded-lg mb-4",
                      tierConfig.sellerFee === 0 
                        ? "bg-gradient-to-r from-emerald-500/10 to-green-500/5 border border-emerald-500/20"
                        : "bg-gradient-to-r from-primary/10 to-purple-500/5 border border-primary/20"
                    )}>
                      <div className="flex items-center gap-2">
                        <Percent className={cn("h-4 w-4", tierConfig.iconColor)} />
                        <span className="text-sm font-medium">{tierConfig.sellerFeeLabel}</span>
                      </div>
                    </div>
                  )}

                  {/* CTA Button */}
                  <Button
                    className={cn(
                      "w-full mb-6",
                      tierConfig.popular && !isCurrentPlan
                        ? "bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white"
                        : isCurrentPlan
                          ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-default"
                          : "bg-secondary hover:bg-secondary/80"
                    )}
                    onClick={() => !isCurrentPlan && !isDowngrade && handleSubscribe(tierConfig.id)}
                    disabled={purchasing === tierConfig.id || isCurrentPlan || isDowngrade}
                  >
                    {purchasing === tierConfig.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Current Plan
                      </>
                    ) : isDowngrade ? (
                      "Manage in Settings"
                    ) : canUpgrade ? (
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

          {/* Free Credits Notice */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm">
                <strong className="text-primary">New users</strong> get 3 free credits — no card required!
              </span>
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