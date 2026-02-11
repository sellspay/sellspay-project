import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

interface OutcomeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient?: string;
  onLaunch: () => void;
  comingSoon?: boolean;
}

export function OutcomeCard({ title, description, icon: Icon, gradient, onLaunch, comingSoon }: OutcomeCardProps) {
  return (
    <motion.button
      onClick={onLaunch}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative flex flex-col text-left w-full rounded-xl border border-border/20 bg-card/30 backdrop-blur-sm overflow-hidden hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
    >
      {/* Top gradient strip */}
      <div className={`h-32 w-full ${gradient || "bg-gradient-to-br from-primary/10 to-primary/5"} flex items-center justify-center`}>
        <Icon className="h-10 w-10 text-primary/40 group-hover:text-primary/60 transition-colors" />
      </div>

      <div className="p-5 space-y-2 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {comingSoon && (
            <span className="text-[9px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase tracking-wider">Soon</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>

      {/* Bottom bar */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          Launch <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </motion.button>
  );
}
