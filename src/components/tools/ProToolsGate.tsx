import { Lock, Coins, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  // Not logged in - show login prompt
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Sign in to Use Tools</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Create a free account to access our audio tools. New users get 5 free credits!
        </p>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/login")}>
            Sign In
          </Button>
          <Button variant="outline" onClick={() => navigate("/signup")}>
            Create Account
          </Button>
        </div>
      </div>
    );
  }

  // Pro tool without credits - still show tool, but with warning banner
  // The tool itself will show a dialog when user tries to generate

  // All good - show the tool (with credit indicator for pro tools)
  return (
    <div>
      {isProTool && (
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
    </div>
  );
}
