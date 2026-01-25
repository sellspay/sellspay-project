import { useState } from "react";
import { Sparkles, Crown } from "lucide-react";
import SubscribeDialog from "@/components/profile/SubscribeDialog";
import { cn } from "@/lib/utils";

interface PlanBenefit {
  planId: string;
  planName: string;
  planPriceCents: number;
  planCurrency: string;
  isFree: boolean;
  discountPercent: number | null;
  discountType: string | null;
}

interface SubscriptionBadgeProps {
  creatorId: string;
  creatorName: string;
  planBenefits: PlanBenefit[];
  isSubscriptionOnly: boolean;
  activeSubscriptionPlanId?: string | null;
  className?: string;
}

export function SubscriptionBadge({
  creatorId,
  creatorName,
  planBenefits,
  isSubscriptionOnly,
  activeSubscriptionPlanId,
  className,
}: SubscriptionBadgeProps) {
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);

  // If user already has a subscription that covers this product, don't show badge
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

  // Determine badge content
  let badgeText: string;
  let badgeIcon: React.ReactNode;
  let badgeStyle: string;

  if (isSubscriptionOnly) {
    badgeText = "Subscribers Only";
    badgeIcon = <Crown className="w-3.5 h-3.5" />;
    badgeStyle = "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400";
  } else if (bestFreeOffer) {
    badgeText = "Free with sub";
    badgeIcon = <Sparkles className="w-3.5 h-3.5" />;
    badgeStyle = "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400";
  } else if (bestDiscountOffer) {
    badgeText = `${bestDiscountOffer.discountPercent}% off`;
    badgeIcon = <Sparkles className="w-3.5 h-3.5" />;
    badgeStyle = "from-violet-500/20 to-purple-500/20 border-violet-500/30 text-violet-400";
  } else {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowSubscribeDialog(true)}
        className={cn(
          "group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
          "bg-gradient-to-r border backdrop-blur-sm",
          "transition-all duration-300 hover:scale-105",
          "hover:shadow-lg hover:shadow-primary/20",
          badgeStyle,
          className
        )}
      >
        {badgeIcon}
        <span>{badgeText}</span>
      </button>

      <SubscribeDialog
        open={showSubscribeDialog}
        onOpenChange={setShowSubscribeDialog}
        creatorId={creatorId}
        creatorName={creatorName}
      />
    </>
  );
}
