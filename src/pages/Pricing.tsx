import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, 
  Check, 
  Zap, 
  Mic2, 
  Volume2, 
  Music, 
  SlidersHorizontal,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  is_popular: boolean;
  display_order: number;
}

const proTools = [
  { icon: Volume2, name: "SFX Generator", description: "Create sound effects from text" },
  { icon: Mic2, name: "Voice Isolator", description: "Remove vocals or background" },
  { icon: SlidersHorizontal, name: "SFX Isolator", description: "Isolate sound effects" },
  { icon: Music, name: "Music Splitter", description: "Split stems (vocals, drums, bass)" },
];

const faqItems = [
  {
    question: "What are credits?",
    answer: "Credits are used to power our AI audio tools. Each time you use a Pro tool (like SFX Generator or Voice Isolator), 1 credit is deducted from your balance. Free tools don't use any credits."
  },
  {
    question: "Do credits expire?",
    answer: "No! Your credits never expire. Use them whenever you want, at your own pace."
  },
  {
    question: "What happens when I run out of credits?",
    answer: "You can always top up with more credits. Free tools will continue to work without credits. You'll also get 5 free credits when you sign up!"
  },
  {
    question: "Can I get a refund?",
    answer: "We offer refunds for unused credits within 14 days of purchase. Please contact our support team for assistance."
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const { creditBalance, checkCredits, startCheckout } = useCredits();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    fetchPackages();
    
    // Check if returning from canceled checkout
    if (searchParams.get("canceled") === "true") {
      toast.info("Checkout canceled. You can try again when you're ready.");
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
    } catch (err) {
      console.error("Error fetching packages:", err);
      toast.error("Failed to load pricing packages");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    if (!user) {
      navigate("/login");
      return;
    }

    setCheckoutLoading(packageId);
    try {
      await startCheckout(packageId);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const calculateSavings = (pkg: CreditPackage) => {
    // Use Starter as baseline (15 credits for $4.99 = $0.33 per credit)
    const baselinePerCredit = 499 / 15;
    const pkgPerCredit = pkg.price_cents / pkg.credits;
    const savings = ((baselinePerCredit - pkgPerCredit) / baselinePerCredit) * 100;
    return Math.round(savings);
  };

  return (
    <MainLayout>
      <div className="min-h-screen py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-500 border-amber-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Credit-Based Pricing
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Power Your Creativity with Credits
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Purchase credits to unlock AI-powered audio tools. No subscriptions, no commitments — pay only for what you use.
            </p>
            
            {user && (
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <Coins className="w-5 h-5 text-amber-500" />
                <span className="text-muted-foreground">Your Balance:</span>
                <span className="font-bold text-amber-500">{creditBalance} credits</span>
              </div>
            )}
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-16">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-72 rounded-2xl bg-secondary/50 animate-pulse" />
              ))
            ) : (
              packages.map((pkg) => {
                const savings = calculateSavings(pkg);
                const pricePerCredit = (pkg.price_cents / pkg.credits / 100).toFixed(2);
                
                return (
                  <div
                    key={pkg.id}
                    className={cn(
                      "relative rounded-2xl p-6 transition-all",
                      "border bg-card hover:shadow-lg hover:scale-[1.02]",
                      pkg.is_popular
                        ? "border-amber-500/50 shadow-lg shadow-amber-500/10"
                        : "border-border/50"
                    )}
                  >
                    {pkg.is_popular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                        Most Popular
                      </Badge>
                    )}
                    
                    {savings > 0 && (
                      <Badge variant="outline" className="absolute top-4 right-4 text-xs border-green-500/30 text-green-500">
                        Save {savings}%
                      </Badge>
                    )}

                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold mb-1">{pkg.name}</h3>
                      <div className="flex items-center justify-center gap-1.5 mb-2">
                        <Coins className="w-5 h-5 text-amber-500" />
                        <span className="text-2xl font-bold text-amber-500">{pkg.credits}</span>
                        <span className="text-muted-foreground">credits</span>
                      </div>
                      <div className="text-3xl font-bold">
                        ${(pkg.price_cents / 100).toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ${pricePerCredit} per credit
                      </p>
                    </div>

                    <Button
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={checkoutLoading !== null}
                      className={cn(
                        "w-full",
                        pkg.is_popular
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                          : ""
                      )}
                    >
                      {checkoutLoading === pkg.id ? (
                        "Loading..."
                      ) : (
                        <>
                          <Coins className="w-4 h-4 mr-2" />
                          Get Credits
                        </>
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          {/* Pro Tools Section */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">What You Can Create</h2>
              <p className="text-muted-foreground">
                Use 1 credit per Pro tool use. Free tools are always unlimited!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {proTools.map((tool) => (
                <div
                  key={tool.name}
                  className="p-4 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-3">
                    <tool.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">{tool.name}</h3>
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                  <Badge className="mt-2 bg-amber-500/10 text-amber-500 border-amber-500/30">
                    1 credit per use
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Free Credits Notice */}
          <div className="mb-16 p-6 rounded-2xl bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-transparent border border-green-500/20 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">New Users Get 5 Free Credits!</h3>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Sign up for a free account and instantly receive 5 credits to try out our AI-powered tools. No credit card required.
            </p>
            {!user && (
              <Button
                onClick={() => navigate("/signup")}
                className="mt-4 bg-green-500 hover:bg-green-600"
              >
                Sign Up Free
              </Button>
            )}
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className="border border-border/50 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
                  >
                    <span className="font-medium">{item.question}</span>
                    {expandedFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-4 pb-4 text-muted-foreground">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
