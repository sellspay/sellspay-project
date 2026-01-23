import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import MainLayout from "@/components/layout/MainLayout";
import { Wallet, Check, Zap, Music, Mic, Wand2, Loader2, Sparkles, Shield, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  is_popular: boolean;
  display_order: number;
  stripe_price_id: string | null;
}

// Mapping to monthly recurring price IDs
const MONTHLY_PRICE_MAP: Record<number, string> = {
  25: "price_1SssVIE5Ga1Ha0QbMRTCVK4R",  // Starter
  50: "price_1SssVSE5Ga1Ha0Qb0fUFWDk9",  // Basic
  150: "price_1SssVhE5Ga1Ha0Qbt8oDdKvc", // Pro
  350: "price_1SssWzE5Ga1Ha0QbGjeeSuID", // Power
  1000: "price_1SssXEE5Ga1Ha0QbgDYnF7Ds", // Enterprise
};

const proTools = [
  { 
    icon: Wand2, 
    name: "SFX Generator", 
    description: "Create custom sound effects from text descriptions using AI" 
  },
  { 
    icon: Mic, 
    name: "Voice Isolator", 
    description: "Remove background music and isolate vocals from any audio" 
  },
  { 
    icon: Music, 
    name: "Music Splitter", 
    description: "Split audio into separate stems: drums, bass, vocals, and more" 
  },
  { 
    icon: Zap, 
    name: "SFX Isolator", 
    description: "Extract and isolate sound effects from complex audio files" 
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
  const { creditBalance, isLoading: creditsLoading, startCheckout, verifyPurchase, subscription } = useCredits();
  
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  // Fetch packages and handle success/cancel params
  useEffect(() => {
    fetchPackages();
    
    // Handle Stripe redirect
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
      
      // Select the popular package by default, or the middle one
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

    // Get the monthly recurring price ID based on credits
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
    return (cents / 100).toFixed(2);
  };

  const calculatePerCredit = (pkg: CreditPackage) => {
    return (pkg.price_cents / pkg.credits / 100).toFixed(2);
  };

  const calculateSavings = (pkg: CreditPackage) => {
    // Compare against $0.20 per credit baseline (Starter rate)
    const baselineRate = 0.20;
    const actualRate = pkg.price_cents / pkg.credits / 100;
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
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-10 sm:py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Pro AI Tools</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
              Unlock Powerful Audio Tools
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Get monthly credits to access our AI-powered audio tools. Cancel anytime.
            </p>
          </div>

          {/* Current Balance */}
          {user && (
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-xs">Balance:</span>
                <span className="font-semibold">
                  {creditsLoading ? "..." : creditBalance}
                </span>
                <span className="text-xs text-muted-foreground">credits</span>
              </div>
            </div>
          )}

          {/* Active Subscription Notice */}
          {subscription && (
            <div className="max-w-md mx-auto mb-6">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Active: {subscription.credits} credits/month
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Main Pricing Card - Compact Premium Design */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-xl opacity-50" />
              
              <Card className="relative border border-primary/20 bg-card/80 backdrop-blur-xl shadow-2xl">
                <CardHeader className="text-center pb-3 pt-5">
                  <div className="mx-auto w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-3">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Credit Subscription</CardTitle>
                  <CardDescription className="text-xs">
                    Choose your monthly credit allocation
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4 pb-5">
                  {/* Package Selector */}
                  <div>
                    <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                      <SelectTrigger className="w-full h-11 bg-secondary/30">
                        <SelectValue placeholder="Choose a package" />
                      </SelectTrigger>
                      <SelectContent>
                        {packages.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            <div className="flex items-center justify-between w-full gap-3">
                              <span className="font-medium text-sm">{pkg.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {pkg.credits} · ${formatPrice(pkg.price_cents)}/mo
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selected Package Details */}
                  {selectedPackage && (
                    <>
                      <div className="text-center py-3 bg-gradient-to-br from-secondary/50 to-secondary/20 rounded-lg border border-border/30">
                        <div className="flex items-baseline justify-center gap-0.5">
                          <span className="text-3xl font-bold">
                            ${formatPrice(selectedPackage.price_cents)}
                          </span>
                          <span className="text-sm text-muted-foreground">/mo</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <span className="text-base font-semibold text-primary">
                            {selectedPackage.credits} Credits
                          </span>
                          {calculateSavings(selectedPackage) > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                              -{calculateSavings(selectedPackage)}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ${calculatePerCredit(selectedPackage)}/credit
                        </p>
                      </div>

                      {/* Compact Pro Tools Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {proTools.map((tool) => (
                          <div key={tool.name} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/20">
                            <tool.icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <span className="text-xs font-medium truncate">{tool.name}</span>
                          </div>
                        ))}
                      </div>

                      {/* Compact Benefits */}
                      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-green-500" />
                          Monthly refresh
                        </span>
                        <span className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-green-500" />
                          Cancel anytime
                        </span>
                        <span className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-green-500" />
                          Priority processing
                        </span>
                      </div>

                      {/* Subscribe Button */}
                      <Button 
                        className="w-full h-10 text-sm font-semibold" 
                        onClick={handleSubscribe}
                        disabled={purchasing || !selectedPackage}
                      >
                        {purchasing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Processing...
                          </>
                        ) : subscription ? (
                          <>Change Plan · ${formatPrice(selectedPackage.price_cents)}/mo</>
                        ) : (
                          <>Subscribe · ${formatPrice(selectedPackage.price_cents)}/mo</>
                        )}
                      </Button>

                      <p className="text-[10px] text-center text-muted-foreground">
                        Secure payment via Stripe
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Free Credits Notice */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs">
                <strong>New users:</strong> Get 3 free credits — no card required!
              </span>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-12">
            <h2 className="text-xl font-bold text-center mb-6">FAQ</h2>
            <Accordion type="single" collapsible className="max-w-lg mx-auto">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-sm">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
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
