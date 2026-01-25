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
import { Store } from "lucide-react";

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
  loading,
}: SellerConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <AlertDialogTitle className="text-center">
            Turn your account into a store?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-2">
            <p>
              If you proceed, you're turning your account into a seller account.
              This unlocks the ability to create and sell products.
            </p>
            <p className="text-xs text-muted-foreground">
              You can always switch back to a buyer account in Settings.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-2">
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }} 
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? "Switching..." : "Yes, become a seller"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
