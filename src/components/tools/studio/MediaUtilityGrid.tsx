import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

interface UtilityTool {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
}

interface MediaUtilityGridProps {
  tools: UtilityTool[];
  onLaunch: (toolId: string) => void;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export function MediaUtilityGrid({ tools, onLaunch }: MediaUtilityGridProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={container}
      className="max-w-7xl mx-auto px-4 sm:px-6"
    >
      <motion.h2 variants={item} className="text-xl sm:text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        🛠 Media Utilities
      </motion.h2>
      <motion.div variants={container} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {tools.map((tool) => (
          <motion.button
            key={tool.id}
            variants={item}
            onClick={() => onLaunch(tool.id)}
            whileHover={{ y: -2 }}
            className="group flex items-center gap-3 p-4 rounded-xl border border-border/20 bg-card/20 backdrop-blur-sm hover:border-primary/20 hover:bg-card/40 transition-all text-left"
          >
            <tool.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-foreground block truncate">{tool.name}</span>
            </div>
            <ArrowRight className="h-3 w-3 text-muted-foreground/0 group-hover:text-primary/60 transition-all shrink-0" />
          </motion.button>
        ))}
      </motion.div>
    </motion.section>
  );
}
