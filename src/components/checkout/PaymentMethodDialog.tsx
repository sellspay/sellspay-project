import { useState } from "react";
import { CreditCard, Wallet, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  priceCents: number;
  currency?: string;
}

type PaymentMethod = "stripe" | "paypal";

export function PaymentMethodDialog({
  open,
  onOpenChange,
  productId,
  productName,
  priceCents,
  currency = "USD",
}: PaymentMethodDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("stripe");
  const [processing, setProcessing] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(cents / 100);
  };

  const handleStripeCheckout = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { product_id: productId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        toast.success("Checkout opened in a new tab");
        onOpenChange(false);
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Stripe checkout error:", error);
      const message = error instanceof Error ? error.message : "Failed to start checkout";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const handlePayPalCheckout = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-paypal-order", {
        body: { product_id: productId },
      });

      if (error) throw error;

      if (data?.approvalUrl) {
        window.open(data.approvalUrl, "_blank");
        toast.success("PayPal checkout opened in a new tab");
        onOpenChange(false);
      } else {
        throw new Error("No PayPal approval URL returned");
      }
    } catch (error) {
      console.error("PayPal checkout error:", error);
      const message = error instanceof Error ? error.message : "Failed to start PayPal checkout";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleProceed = () => {
    if (selectedMethod === "stripe") {
      handleStripeCheckout();
    } else {
      handlePayPalCheckout();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Payment Method</DialogTitle>
          <DialogDescription>
            Purchase "{productName}" for {formatPrice(priceCents)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment Method Options */}
          <div className="grid gap-3">
            {/* Stripe Option */}
            <button
              onClick={() => setSelectedMethod("stripe")}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                selectedMethod === "stripe"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Credit / Debit Card</p>
                <p className="text-sm text-muted-foreground">
                  Pay securely with Stripe
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedMethod === "stripe"
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                }`}
              >
                {selectedMethod === "stripe" && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </button>

            {/* PayPal Option */}
            <button
              onClick={() => setSelectedMethod("paypal")}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                selectedMethod === "paypal"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Wallet className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium">PayPal</p>
                <p className="text-sm text-muted-foreground">
                  Pay with your PayPal account
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedMethod === "paypal"
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                }`}
              >
                {selectedMethod === "paypal" && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </button>
          </div>

          {/* Terms Agreement Checkbox */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <Checkbox
              id="terms-agreement"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              className="mt-0.5"
            />
            <label 
              htmlFor="terms-agreement" 
              className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
            >
              I agree to SellsPay's{" "}
              <a 
                href="/terms" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a 
                href="/refunds" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Refund Policy
              </a>
            </label>
          </div>

          {/* Proceed Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleProceed}
            disabled={processing || !termsAccepted}
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Continue with {selectedMethod === "stripe" ? "Card" : "PayPal"}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You'll be redirected to complete your payment securely
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
