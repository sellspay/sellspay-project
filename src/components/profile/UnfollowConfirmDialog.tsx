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
import { AlertTriangle } from "lucide-react";

interface UnfollowConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function UnfollowConfirmDialog({
  open,
  onOpenChange,
  username,
  onConfirm,
  loading,
}: UnfollowConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Unfollow @{username}?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              If you unfollow, you won't be able to follow back for{" "}
              <span className="font-semibold text-foreground">7 days</span>.
            </p>
            <p>
              This means you'll lose access to their free downloads during this
              period.
            </p>
            <p className="text-xs text-muted-foreground">
              This policy helps creators maintain authentic engagement and prevents
              follow/unfollow abuse.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? "Processing..." : "Unfollow Anyway"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
