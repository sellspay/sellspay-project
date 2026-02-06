import { ShieldAlert, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface PolicyViolationCardProps {
  category: string;
  message: string;
}

export function PolicyViolationCard({ category, message }: PolicyViolationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 mb-6 group w-full"
    >
      {/* Shield Icon */}
      <div className="shrink-0 mt-1">
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
          <ShieldAlert size={14} className="text-amber-400" />
        </div>
      </div>

      {/* Card Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl rounded-tl-sm p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
              {category}
            </span>
          </div>

          {/* Message */}
          <p className="text-sm text-amber-100/90 leading-relaxed">
            {message}
          </p>

          {/* Footer */}
          <div className="flex items-center gap-1.5 pt-1">
            <Info size={10} className="text-amber-500/60" />
            <span className="text-[10px] text-amber-500/60 italic">
              SellsPay Content Guidelines
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
