import { Lock, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PlanLockOverlayProps {
  type: 'upgrade' | 'credits' | 'video';
  className?: string;
}

export function PlanLockOverlay({ type, className }: PlanLockOverlayProps) {
  const navigate = useNavigate();

  const handleAction = () => {
    navigate("/pricing");
  };

  const content = {
    upgrade: {
      icon: <Lock className="w-8 h-8 text-primary" />,
      iconBg: "from-primary/20 to-purple-500/10 border-primary/20",
      title: "Unlock AI Tools",
      description: "Subscribe to Creator or Agency to access Vibecoder AI, image generation, and premium audio tools.",
      buttonText: "View Plans",
      buttonClass: "bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white",
    },
    credits: {
      icon: <Zap className="w-8 h-8 text-amber-500" />,
      iconBg: "from-amber-500/20 to-orange-500/10 border-amber-500/20",
      title: "Out of Credits",
      description: "You've used all your AI credits. Upgrade your plan for more credits or wait for your monthly refill.",
      buttonText: "Get More Credits",
      buttonClass: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white",
    },
    video: {
      icon: <Crown className="w-8 h-8 text-amber-500" />,
      iconBg: "from-amber-500/20 to-yellow-500/10 border-amber-500/20",
      title: "Agency Feature",
      description: "Video generation is exclusive to Agency plan members. Upgrade to create cinematic backgrounds.",
      buttonText: "Upgrade to Agency",
      buttonClass: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white",
    },
  };

  const { icon, iconBg, title, description, buttonText, buttonClass } = content[type];

  return (
    <div className={cn(
      "absolute inset-0 z-20",
      "bg-background/80 backdrop-blur-sm",
      "flex flex-col items-center justify-center text-center p-6",
      "rounded-lg",
      className
    )}>
      <div className={cn(
        "w-16 h-16 rounded-2xl",
        "bg-gradient-to-br",
        iconBg,
        "border",
        "flex items-center justify-center mb-4",
        "shadow-lg"
      )}>
        {icon}
      </div>
      
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        {description}
      </p>

      <Button onClick={handleAction} className={cn("px-6", buttonClass)}>
        <Sparkles className="w-4 h-4 mr-2" />
        {buttonText}
      </Button>
    </div>
  );
}
