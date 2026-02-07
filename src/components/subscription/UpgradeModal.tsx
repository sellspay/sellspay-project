import { forwardRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Crown, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredFeature?: 'vibecoder' | 'imageGen' | 'videoGen';
  insufficientCredits?: boolean;
}

export const UpgradeModal = forwardRef<HTMLDivElement, UpgradeModalProps>(function UpgradeModal(
  {
    open,
    onOpenChange,
    requiredFeature,
    insufficientCredits = false,
  },
  ref
) {
  const navigate = useNavigate();
  const { plan } = useSubscription();

  const handleUpgradeClick = () => {
    onOpenChange(false);
    navigate("/pricing");
  };

  const getTitle = () => {
    if (insufficientCredits) return "Out of Credits";
    if (requiredFeature === 'videoGen') return "Unlock Video Generation";
    return "Unlock AI Tools";
  };

  const getDescription = () => {
    if (insufficientCredits) {
      return "You've used all your AI credits for this month. Upgrade your plan or wait for your monthly refill.";
    }
    if (requiredFeature === 'videoGen') {
      return "Video generation is exclusive to Agency plan members. Upgrade to create cinematic video backgrounds.";
    }
    return "Access Vibecoder AI, image generation, and premium audio tools with a Creator or Agency subscription.";
  };

  const getRecommendedPlan = () => {
    if (requiredFeature === 'videoGen') return 'agency';
    if (plan === 'browser') return 'creator';
    return 'agency';
  };

  const recommendedPlan = getRecommendedPlan();

  return (
    <div ref={ref}>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/10 border border-primary/20 flex items-center justify-center mb-4">
            {insufficientCredits ? (
              <Coins className="w-8 h-8 text-amber-500" />
            ) : (
              <Crown className="w-8 h-8 text-primary" />
            )}
          </div>
          <DialogTitle className="text-xl">{getTitle()}</DialogTitle>
          <DialogDescription className="text-center">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {recommendedPlan === 'creator' && (
            <button
              onClick={handleUpgradeClick}
              className="w-full flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/5 border border-primary/20 hover:from-primary/20 hover:to-purple-500/10 hover:border-primary/30 transition-all cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Creator Plan</p>
                <p className="text-muted-foreground text-sm">
                  $69/mo • 2,500 credits • 5% seller fee
                </p>
              </div>
            </button>
          )}
          
          <button
            onClick={handleUpgradeClick}
            className="w-full flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 hover:from-amber-500/20 hover:to-orange-500/10 hover:border-amber-500/30 transition-all cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Agency Plan</p>
              <p className="text-muted-foreground text-sm">
                $199/mo • 12,000 credits • 0% seller fee • Video Gen
              </p>
            </div>
          </button>
        </div>

        <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
          Maybe Later
        </Button>
      </DialogContent>
      </Dialog>
    </div>
  );
});
UpgradeModal.displayName = 'UpgradeModal';
