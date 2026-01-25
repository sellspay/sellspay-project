import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Crown, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OutOfCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OutOfCreditsDialog({ open, onOpenChange }: OutOfCreditsDialogProps) {
  const navigate = useNavigate();

  const handleViewPlans = () => {
    onOpenChange(false);
    navigate("/pricing");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            <Coins className="w-8 h-8 text-amber-500" />
          </div>
          <DialogTitle className="text-xl">Out of Credits</DialogTitle>
          <DialogDescription className="text-center">
            You need credits to use this AI-powered tool. Top up or subscribe to continue creating.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20">
            <Crown className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Subscribe & Save</p>
              <p className="text-muted-foreground text-xs">Get monthly credits + reduced platform fees</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <div className="text-sm">
              <p className="font-medium">One-Time Top Up</p>
              <p className="text-muted-foreground text-xs">Buy credits that never expire</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            onClick={handleViewPlans}
          >
            <Coins className="w-4 h-4 mr-2" />
            View Plans
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
