import { motion } from "framer-motion";
import { Coins, ArrowUpRight, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface InsufficientCreditsCardProps {
  creditsNeeded: number;
  creditsAvailable: number;
  onUpgrade: () => void;
}

export function InsufficientCreditsCard({ 
  creditsNeeded, 
  creditsAvailable, 
  onUpgrade 
}: InsufficientCreditsCardProps) {
  const navigate = useNavigate();
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4 mb-6"
    >
      {/* Amber pulsing avatar */}
      <div className="flex-shrink-0 mt-1">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
          <Coins size={14} className="text-amber-400 animate-pulse" />
        </div>
      </div>
      
      {/* Error card */}
      <div className="flex-1 bg-gradient-to-br from-amber-500/5 via-zinc-900 to-orange-500/5 border border-amber-500/30 rounded-2xl rounded-tl-sm p-5 shadow-lg">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-semibold text-amber-400 mb-1">
              Not Enough Credits
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              This build requires <span className="font-medium text-amber-300">~{creditsNeeded}</span> credits, 
              but you have <span className="font-medium text-zinc-300">{creditsAvailable}</span>.
            </p>
          </div>
          <div className="flex-shrink-0 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <CreditCard size={20} className="text-amber-400" />
          </div>
        </div>
        
        {/* Credit comparison pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800/60 rounded-full border border-zinc-700 mb-4">
          <span className="text-xs text-zinc-500">Need</span>
          <span className="text-xs font-medium text-amber-400">{creditsNeeded}c</span>
          <span className="text-xs text-zinc-600">•</span>
          <span className="text-xs text-zinc-500">Have</span>
          <span className="text-xs font-medium text-zinc-300">{creditsAvailable}c</span>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={onUpgrade}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
          >
            <Coins size={14} className="mr-2" />
            Upgrade Plan
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/pricing')}
            className="border-zinc-700 hover:bg-zinc-800"
          >
            View Pricing
            <ArrowUpRight size={14} className="ml-1.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Parse credit error message from backend
 * Example: "Insufficient credits. Need ~8, have 0."
 */
export function parseCreditsError(message: string): {
  creditsNeeded: number;
  creditsAvailable: number;
  message: string;
} {
  const match = message.match(/Need ~(\d+), have (\d+)/i);
  return match 
    ? {
        creditsNeeded: parseInt(match[1], 10),
        creditsAvailable: parseInt(match[2], 10),
        message,
      }
    : {
        creditsNeeded: 3, // Default minimum
        creditsAvailable: 0,
        message,
      };
}

/**
 * Check if an error message is a credits error
 */
export function isCreditsError(message?: string): boolean {
  if (!message) return false;
  return message.toLowerCase().includes('insufficient credits');
}
