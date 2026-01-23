import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import MainLayout from "@/components/layout/MainLayout";
import { Wallet, Check, Zap, Music, Mic, Wand2, Loader2, Sparkles, Crown, Star, ArrowRight, Volume2 } from "lucide-react";
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
  15: "price_1SssVIE5Ga1Ha0QbMRTCVK4R",   // Starter
  50: "price_1SssVSE5Ga1Ha0Qb0fUFWDk9",   // Basic
  150: "price_1SssVhE5Ga1Ha0Qbt8oDdKvc",  // Pro
  350: "price_1SssWzE5Ga1Ha0QbGjeeSuID",  // Power
  800: "price_1SssXEE5Ga1Ha0QbgDYnF7Ds",  // Enterprise
};

const proTools = [
  { icon: Volume2, name: "SFX Generator" },
  { icon: Mic, name: "Voice Isolator" },
  { icon: Music, name: "Music Splitter" },
  { icon: Zap, name: "SFX Isolator" },
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
  const { creditBalance, isLoading: creditsLoading, startCheckout, verifyPurchase, subscription } = useCredits();
  
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

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
      
      const pkgs = data || [];
      setPackages(pkgs);
      
      const popularPkg = pkgs.find(p => p.is_popular);
      if (popularPkg) {
        setSelectedPackageId(popularPkg.id);
      } else if (pkgs.length > 0) {
        setSelectedPackageId(pkgs[Math.floor(pkgs.length / 2)]?.id || pkgs[0].id);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast.error("Failed to load pricing");
    } finally {
      setLoading(false);
    }
  };

  const selectedPackage = packages.find(p => p.id === selectedPackageId);

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      navigate("/login");
      return;
    }

    if (!selectedPackage) {
      toast.error("Please select a package");
      return;
    }

    const monthlyPriceId = MONTHLY_PRICE_MAP[selectedPackage.credits];
    if (!monthlyPriceId) {
      toast.error("Invalid package configuration");
      return;
    }

    setPurchasing(true);
    try {
      await startCheckout(selectedPackage.id, monthlyPriceId);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout");
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(0);
  };

  const calculatePerCredit = (pkg: CreditPackage) => {
    return (pkg.price_cents / pkg.credits / 100).toFixed(2);
  };

  const calculateSavings = (pkg: CreditPackage) => {
    const starterPkg = packages.find(p => p.display_order === 1);
    if (!starterPkg || pkg.id === starterPkg.id) return 0;
    const baselineRate = starterPkg.price_cents / starterPkg.credits;
    const actualRate = pkg.price_cents / pkg.credits;
    const savings = Math.round((1 - actualRate / baselineRate) * 100);
    return savings > 0 ? savings : 0;
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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent rounded-full blur-3xl opacity-50" />
        
        <div className="relative max-w-5xl mx-auto px-4 py-12 sm:py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/20 mb-6">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Unlock Pro Tools
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Create <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">Unlimited</span> Audio
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional AI-powered audio tools at your fingertips. Choose your plan and start creating.
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

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {packages.slice(0, 5).map((pkg) => {
              const isSelected = pkg.id === selectedPackageId;
              const isPopular = pkg.is_popular;
              const savings = calculateSavings(pkg);
              
              return (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={cn(
                    "relative p-6 rounded-2xl text-left transition-all duration-300 group",
                    "border-2",
                    isSelected
                      ? "border-primary bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent scale-[1.02] shadow-xl shadow-primary/20"
                      : "border-border/50 bg-card/50 hover:border-primary/50 hover:bg-card/80"
                  )}
                >
                  {/* Popular badge */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="px-4 py-1 rounded-full bg-gradient-to-r from-primary to-purple-500 text-xs font-bold text-white shadow-lg shadow-primary/30">
                        MOST POPULAR
                      </div>
                    </div>
                  )}

                  {/* Selection indicator */}
                  <div className={cn(
                    "absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  )}>
                    {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                  </div>

                  {/* Content */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold mb-1">{pkg.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${formatPrice(pkg.price_cents)}</span>
                      <span className="text-muted-foreground">/mo</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className={cn(
                      "px-3 py-1.5 rounded-lg font-bold text-sm",
                      isSelected
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-foreground"
                    )}>
                      {pkg.credits} Credits
                    </div>
                    {savings > 0 && (
                      <div className="px-2 py-1 rounded-md bg-green-500/10 text-green-500 text-xs font-semibold">
                        Save {savings}%
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    ${calculatePerCredit(pkg)} per credit
                  </p>
                </button>
              );
            })}
          </div>

          {/* CTA Section */}
          {selectedPackage && (
            <div className="max-w-lg mx-auto">
              <div className="relative">
                {/* Glow */}
                <div className="absolute -inset-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-30 animate-pulse" />
                
                <div className="relative p-8 rounded-2xl bg-gradient-to-br from-card via-card to-card/90 border border-primary/30 shadow-2xl">
                  {/* Selected plan summary */}
                  <div className="text-center mb-6">
                    <p className="text-sm text-muted-foreground mb-1">Selected Plan</p>
                    <h3 className="text-2xl font-bold">{selectedPackage.name}</h3>
                    <div className="flex items-baseline justify-center gap-1 mt-2">
                      <span className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                        ${formatPrice(selectedPackage.price_cents)}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <p className="text-primary font-semibold mt-1">{selectedPackage.credits} Credits</p>
                  </div>

                  {/* Pro tools grid */}
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {proTools.map((tool) => (
                      <div key={tool.name} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50">
                        <tool.icon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{tool.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Benefits */}
                  <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-green-500" />
                      Monthly credits
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-green-500" />
                      Cancel anytime
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-green-500" />
                      Priority support
                    </span>
                  </div>

                  {/* Subscribe Button */}
                  <Button 
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_100%] hover:bg-[length:100%_100%] transition-all duration-500"
                    onClick={handleSubscribe}
                    disabled={purchasing}
                  >
                    {purchasing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {subscription ? "Change Plan" : "Get Started"}
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Secure payment via Stripe • Cancel anytime
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Free Credits Notice */}
          <div className="mt-12 text-center">
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
          <div className="mt-16">
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