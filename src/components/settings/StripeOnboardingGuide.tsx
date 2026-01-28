import { useState } from "react";
import { CheckCircle, ArrowRight, User, Building2, ShoppingBag, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StripeOnboardingGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  isLoading?: boolean;
}

const guideSteps = [
  {
    icon: User,
    title: "Business Type",
    description: 'Select "Individual" unless you have a registered business entity.',
    tip: "Most creators choose Individual",
  },
  {
    icon: Building2,
    title: "Personal Details",
    description: "Your legal name, date of birth, address, and last 4 digits of SSN (US) for identity verification.",
    tip: "Required for tax documents (1099)",
  },
  {
    icon: ShoppingBag,
    title: "Business & Products",
    description: 'Use your creator/editor name. For products, select "Digital products" or "Professional services".',
    tip: 'Describe as "Digital content creation" or "Video editing"',
  },
  {
    icon: Globe,
    title: "Public Details",
    description: "This appears on customer bank statements. Use your brand name or creator name.",
    tip: "Keep it recognizable to your customers",
  },
];

export function StripeOnboardingGuide({
  open,
  onOpenChange,
  onContinue,
  isLoading = false,
}: StripeOnboardingGuideProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Before You Begin
            <Badge variant="secondary" className="text-xs">One-time setup</Badge>
          </DialogTitle>
          <DialogDescription>
            Stripe requires some information for legal and tax compliance. Here's what you'll need:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {guideSteps.map((step, index) => (
            <div
              key={index}
              className="flex gap-3 p-3 rounded-lg bg-muted/50 border border-border"
            >
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <step.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.description}
                </p>
                <p className="text-xs text-primary/80 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {step.tip}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-warning/10 border border-warning/30 p-3">
          <p className="text-xs text-warning">
            <strong>Important:</strong> Complete all steps in one session. If you leave before finishing, you'll need to start over. This is a one-time setup.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onContinue} disabled={isLoading}>
            {isLoading ? (
              "Connecting..."
            ) : (
              <>
                Continue to Stripe
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
