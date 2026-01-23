import { Lock, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

interface ProToolsGateProps {
  isProTool: boolean;
  subscribed: boolean;
  usageCount: number;
  usageLimit: number;
  remainingUses: number;
  onSubscribe: () => void;
  children: React.ReactNode;
}

export function ProToolsGate({
  isProTool,
  subscribed,
  usageCount,
  usageLimit,
  remainingUses,
  onSubscribe,
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
          Create a free account to access our audio tools. Pro tools require a subscription.
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

  // Pro tool without subscription - show upgrade prompt
  if (isProTool && !subscribed) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
          <Crown className="w-10 h-10 text-amber-500" />
        </div>
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white mb-4">
          Pro Feature
        </Badge>
        <h2 className="text-2xl font-bold mb-3">Upgrade to Pro Tools</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Unlock AI-powered audio tools including Voice Isolator, SFX Generator, Music Splitter, and more.
        </p>
        
        <div className="bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 rounded-2xl p-6 mb-6 max-w-sm">
          <div className="text-3xl font-bold mb-1">$9.99<span className="text-lg font-normal text-muted-foreground">/month</span></div>
          <p className="text-sm text-muted-foreground mb-4">50 uses per month</p>
          <ul className="text-sm text-left space-y-2">
            <li className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span>Voice Isolator</span>
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span>SFX Generator</span>
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span>Music Splitter</span>
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span>SFX Isolator</span>
            </li>
          </ul>
        </div>

        <Button 
          onClick={onSubscribe}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        >
          <Crown className="w-4 h-4 mr-2" />
          Subscribe Now
        </Button>
      </div>
    );
  }

  // Pro tool with subscription but no remaining uses
  if (isProTool && subscribed && remainingUses <= 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <Zap className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Monthly Limit Reached</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          You've used all {usageLimit} of your monthly Pro Tools uses. Your limit will reset at the start of next month.
        </p>
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-red-500">{usageCount}</span> / {usageLimit} uses this month
        </div>
      </div>
    );
  }

  // All good - show the tool
  return <>{children}</>;
}
