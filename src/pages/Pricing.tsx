import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MainLayout from "@/components/layout/MainLayout";
import { Check, Loader2, Sparkles, Crown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  is_popular: boolean;
  display_order: number;
  stripe_price_id: string | null;
}

// Mapping to monthly recurring price IDs based on actual DB credits
const MONTHLY_PRICE_MAP: Record<number, string> = {
  15: "price_1SssVIE5Ga1Ha0QbMRTCVK4R",
  50: "price_1SssVSE5Ga1Ha0Qb0fUFWDk9",
  150: "price_1SssVhE5Ga1Ha0Qbt8oDdKvc",
  350: "price_1SssWzE5Ga1Ha0QbGjeeSuID",
  800: "price_1SssXEE5Ga1Ha0QbgDYnF7Ds",
};

// Tier definitions
const TIERS = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for trying out our AI audio tools",
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
    features: [
      "All Pro AI tools access",
      "Voice Isolator",
      "Music Splitter",
      "SFX Generator",
      "Priority processing",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For creators who need more power and flexibility",
    color: "from-primary/20 to-purple-500/20",
    borderColor: "border-primary/50",
    popular: true,
    features: [
      "Everything in Starter, plus:",
      "Higher quality exports",
      "Batch processing",
      "Priority support",
      "Early access to new tools",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Built for teams and high-volume creators",
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/30",
    features: [
      "Everything in Pro, plus:",
      "Dedicated support",
      "Custom integrations",
      "Team collaboration",
      "Volume discounts",
    ],
  },
];

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
    question: "Can I cancel anytime?",
    answer: "Yes! You can cancel your subscription at any time from Settings → Billing. You'll keep your credits until the end of your billing period."
  },
  {
    question: "What happens if I run out of credits?",
    answer: "You can upgrade to a higher tier anytime. Your subscription will be prorated for the remaining days in your billing cycle."
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
  const { startCheckout, verifyPurchase, subscription } = useCredits();
  
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  
  // Selected package per tier
  const [selectedCredits, setSelectedCredits] = useState<Record<string, number>>({
    starter: 15,
    pro: 150,
    enterprise: 800,
  });

  useEffect(() => {
    fetchPackages();
    
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

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast.error("Failed to load pricing");
    } finally {
      setLoading(false);
    }
  };

  const getPackagesForTier = (tierId: string) => {
    // Map tiers to credit ranges
    const tierRanges: Record<string, number[]> = {
      starter: [15, 50],
      pro: [150, 350],
      enterprise: [800],
    };
    const range = tierRanges[tierId] || [];
    return packages.filter(pkg => range.includes(pkg.credits));
  };

  const getSelectedPackage = (tierId: string) => {
    const credits = selectedCredits[tierId];
    return packages.find(pkg => pkg.credits === credits);
  };

  const handleSubscribe = async (tierId: string) => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      navigate("/login");
      return;
    }

    const selectedPackage = getSelectedPackage(tierId);
    if (!selectedPackage) {
      toast.error("Please select a package");
      return;
    }

    const monthlyPriceId = MONTHLY_PRICE_MAP[selectedPackage.credits];
    if (!monthlyPriceId) {
      toast.error("Invalid package configuration");
      return;
    }

    setPurchasing(tierId);
    try {
      const result = await startCheckout(selectedPackage.id, monthlyPriceId);
      
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      
      // Handle successful upgrade (no redirect, instant update)
      if (result?.upgraded) {
        toast.success(result.message || "Subscription upgraded successfully!");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout");
    } finally {
      setPurchasing(null);
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(0);
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
                Pricing Plans
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Choose Your <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">Plan</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional AI-powered audio tools. Simple pricing, powerful results.
            </p>
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
                    <p className="font-semibold text-green-400">
                      Active: {subscription.credits} credits/month
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Cards - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {TIERS.map((tier) => {
              const tierPackages = getPackagesForTier(tier.id);
              const selectedPkg = getSelectedPackage(tier.id);
              const isCurrentPlan = subscription && tierPackages.some(p => p.credits === subscription.credits);
              
              return (
                <div
                  key={tier.id}
                  className={cn(
                    "relative flex flex-col rounded-2xl border bg-card/50 backdrop-blur-sm p-6",
                    tier.popular ? "border-primary/50 shadow-lg shadow-primary/10" : "border-border/50"
                  )}
                >
                  {/* Popular badge */}
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="px-4 py-1 rounded-full bg-gradient-to-r from-primary to-purple-500 text-xs font-bold text-white">
                        MOST POPULAR
                      </div>
                    </div>
                  )}

                  {/* Tier header */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {tier.description}
                    </p>
                  </div>

                  {/* Price display */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className={cn(
                        "text-4xl font-bold",
                        tier.popular && "bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent"
                      )}>
                        ${selectedPkg ? formatPrice(selectedPkg.price_cents) : "—"}
                      </span>
                      <span className="text-muted-foreground">per month</span>
                    </div>
                  </div>

                  {/* Credit selector dropdown */}
                  {tierPackages.length > 0 && (
                    <div className="mb-6">
                      <Select
                        value={String(selectedCredits[tier.id])}
                        onValueChange={(value) => setSelectedCredits(prev => ({
                          ...prev,
                          [tier.id]: Number(value)
                        }))}
                      >
                        <SelectTrigger className="w-full bg-secondary/50 border-border/50">
                          <SelectValue placeholder="Select credits" />
                        </SelectTrigger>
                        <SelectContent>
                          {tierPackages.map((pkg) => (
                            <SelectItem key={pkg.id} value={String(pkg.credits)}>
                              {pkg.credits} credits / month
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* CTA Button */}
                  {(() => {
                    const isHigherTier = subscription && selectedPkg && selectedPkg.price_cents > subscription.priceAmount;
                    const isLowerTier = subscription && selectedPkg && selectedPkg.price_cents < subscription.priceAmount;
                    const isSameTier = subscription && selectedPkg && selectedPkg.credits === subscription.credits;
                    
                    return (
                      <Button
                        className={cn(
                          "w-full mb-6",
                          tier.popular
                            ? "bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white"
                            : "bg-secondary hover:bg-secondary/80"
                        )}
                        onClick={() => handleSubscribe(tier.id)}
                        disabled={purchasing === tier.id || !selectedPkg || isSameTier || isLowerTier}
                      >
                        {purchasing === tier.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Processing...
                          </>
                        ) : isSameTier ? (
                          "Current Plan"
                        ) : isLowerTier ? (
                          "Manage in Settings"
                        ) : isHigherTier ? (
                          `Upgrade (+$${((selectedPkg.price_cents - subscription.priceAmount) / 100).toFixed(0)}/mo)`
                        ) : subscription ? (
                          "Upgrade"
                        ) : (
                          "Subscribe"
                        )}
                      </Button>
                    );
                  })()}

                  {/* Features list */}
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-4">
                      {tier.id === "starter" ? "All features:" : `All features in ${tier.id === "pro" ? "Starter" : "Pro"}, plus:`}
                    </p>
                    <ul className="space-y-3">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
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
