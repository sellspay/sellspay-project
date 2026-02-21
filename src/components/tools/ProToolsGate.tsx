import { useState } from "react";
import { Coins, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { SignUpPromoDialog } from "./SignUpPromoDialog";

interface ProToolsGateProps {
  isProTool: boolean;
  creditBalance: number;
  onTopUp: () => void;
  children: React.ReactNode;
}

export function ProToolsGate({
  isProTool,
  creditBalance,
  onTopUp,
  children,
}: ProToolsGateProps) {
  const { user } = useAuth();
  const [showPromo, setShowPromo] = useState(false);

  // Always show the tool to everyone (including guests)
  // The auth check happens at generation time inside each tool
  return (
    <div>
      {isProTool && user && (
        <div className="mb-4 flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="text-sm">
              <span className="font-semibold text-amber-500">{creditBalance}</span>
              <span className="text-muted-foreground"> credits available</span>
            </span>
          </div>
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">
            1 credit per use
          </Badge>
        </div>
      )}
      {children}
      <SignUpPromoDialog open={showPromo} onOpenChange={setShowPromo} />
    </div>
  );
}

/**
 * Hook for tool components to gate generation behind auth.
 * Call `guardGenerate(actualGenerateFn)` instead of calling generate directly.
 * If user is not logged in, shows the signup promo dialog instead.
 */
export function useGenerationAuthGuard() {
  const { user } = useAuth();
  const [showPromo, setShowPromo] = useState(false);

  const guardGenerate = (fn: () => void | Promise<void>) => {
    if (!user) {
      setShowPromo(true);
      return;
    }
    fn();
  };

  return { guardGenerate, showPromo, setShowPromo, isAuthenticated: !!user };
}
