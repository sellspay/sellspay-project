import { useState } from "react";
import { Crown, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SubscribeDialog from "@/components/profile/SubscribeDialog";

interface PlanBenefit {
  planId: string;
  planName: string;
  planPriceCents: number;
  planCurrency: string;
  isFree: boolean;
  discountPercent: number | null;
  discountType: string | null;
}

interface SubscriptionPromotionProps {
  creatorId: string;
  creatorName: string;
  productName: string;
  productPriceCents: number | null;
  productCurrency: string | null;
  planBenefits: PlanBenefit[];
  isSubscriptionOnly: boolean;
  hasActiveSubscription: boolean;
  activeSubscriptionPlanId?: string | null;
}

export function SubscriptionPromotion({
  creatorId,
  creatorName,
  productName,
  productPriceCents,
  productCurrency,
  planBenefits,
  isSubscriptionOnly,
  hasActiveSubscription,
  activeSubscriptionPlanId,
}: SubscriptionPromotionProps) {
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);

  // If user already has a subscription that covers this product, don't show promo
  const activePlanBenefit = planBenefits.find(
    (b) => b.planId === activeSubscriptionPlanId
  );
  if (activePlanBenefit) {
    return null;
  }

  // Find the best offer (free > highest discount)
  const bestFreeOffer = planBenefits.find((b) => b.isFree);
  const bestDiscountOffer = planBenefits
    .filter((b) => !b.isFree && b.discountPercent && b.discountPercent > 0)
    .sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0))[0];

  const formatPlanPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  };

  const formatProductPrice = (cents: number | null, currency: string | null) => {
    if (!cents) return "Free";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  };

  const calculateDiscountedPrice = (
    priceCents: number | null,
    discountPercent: number
  ) => {
    if (!priceCents) return 0;
    return priceCents * (1 - discountPercent / 100);
  };

  // Determine promo message and styling
  let promoMessage: React.ReactNode;
  let bgGradient: string;
  let icon: React.ReactNode;

  if (isSubscriptionOnly) {
    bgGradient =
      "bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border-amber-500/30";
    icon = <Crown className="w-5 h-5 text-amber-500" />;
    promoMessage = (
      <div className="space-y-2">
        <p className="font-semibold text-foreground">
          This product is exclusive to subscribers
        </p>
        <p className="text-sm text-muted-foreground">
          Subscribe to <span className="font-medium">@{creatorName}</span> to
          unlock this content
          {bestFreeOffer && " — it's included FREE with the subscription!"}
        </p>
      </div>
    );
  } else if (bestFreeOffer) {
    bgGradient =
      "bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-emerald-500/30";
    icon = <Sparkles className="w-5 h-5 text-emerald-500" />;
    promoMessage = (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/30">
            FREE with subscription
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Get this product <span className="font-semibold text-emerald-600">free</span>{" "}
          when you subscribe to{" "}
          <span className="font-medium">@{creatorName}</span>'s{" "}
          <span className="font-semibold">{bestFreeOffer.planName}</span> plan for just{" "}
          <span className="font-semibold">
            {formatPlanPrice(bestFreeOffer.planPriceCents, bestFreeOffer.planCurrency)}
            /month
          </span>
        </p>
      </div>
    );
  } else if (bestDiscountOffer) {
    const discountedPrice = calculateDiscountedPrice(
      productPriceCents,
      bestDiscountOffer.discountPercent || 0
    );
    bgGradient =
      "bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border-violet-500/30";
    icon = <Sparkles className="w-5 h-5 text-violet-500" />;
    promoMessage = (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge className="bg-violet-500/20 text-violet-600 border-violet-500/30 hover:bg-violet-500/30">
            {bestDiscountOffer.discountPercent}% off with subscription
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Save{" "}
          <span className="font-semibold text-violet-600">
            {bestDiscountOffer.discountPercent}%
          </span>{" "}
          on this product when you subscribe to{" "}
          <span className="font-medium">@{creatorName}</span>'s{" "}
          <span className="font-semibold">{bestDiscountOffer.planName}</span> plan.
          Pay only{" "}
          <span className="font-semibold">
            {formatProductPrice(discountedPrice, productCurrency)}
          </span>{" "}
          instead of{" "}
          <span className="line-through text-muted-foreground/70">
            {formatProductPrice(productPriceCents, productCurrency)}
          </span>
        </p>
      </div>
    );
  } else {
    // No specific benefits but has subscription plans
    return null;
  }

  // Show all plan benefits as a list
  const otherBenefits = planBenefits.filter(
    (b) => b.planId !== bestFreeOffer?.planId && b.planId !== bestDiscountOffer?.planId
  );

  return (
    <>
      <Card className={`border ${bgGradient} overflow-hidden`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-full bg-background/50">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              {promoMessage}

              {/* Additional plan benefits */}
              {otherBenefits.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Also available with:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {otherBenefits.map((benefit) => (
                      <Badge
                        key={benefit.planId}
                        variant="outline"
                        className="text-xs"
                      >
                        {benefit.planName}:{" "}
                        {benefit.isFree
                          ? "Free"
                          : benefit.discountPercent
                          ? `${benefit.discountPercent}% off`
                          : "Included"}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button
                size="sm"
                className="mt-4 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                onClick={() => setShowSubscribeDialog(true)}
              >
                <Crown className="w-4 h-4 mr-2" />
                View Subscription Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <SubscribeDialog
        open={showSubscribeDialog}
        onOpenChange={setShowSubscribeDialog}
        creatorId={creatorId}
        creatorName={creatorName}
      />
    </>
  );
}
