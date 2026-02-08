import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Store, FileText } from "lucide-react";

interface SellerConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function SellerConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: SellerConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <AlertDialogTitle className="text-center">
            Become a Seller on SellsPay?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-3">
            <p>
              To sell products on our platform, you'll need to complete a quick
              onboarding process including:
            </p>
            <ul className="text-left text-sm space-y-1 bg-muted/50 p-3 rounded-lg">
              <li className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                Age verification (18+ required)
              </li>
              <li className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                Payout method selection (Stripe, PayPal, or Payoneer)
              </li>
              <li className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                Seller Agreement acceptance
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              This only takes a minute. You can sell digital products immediately after.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }} 
            className="bg-primary hover:bg-primary/90"
          >
            Continue to Seller Setup
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
