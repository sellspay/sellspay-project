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
