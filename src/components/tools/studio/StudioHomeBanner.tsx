import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toolsRegistry, SUBCATEGORY_LABELS, type ToolSubcategory } from "@/components/tools/toolsRegistry";
import { toolThumbnails } from "./toolThumbnails";

interface StudioHomeBannerProps {
  creditBalance: number;
  isLoadingCredits: boolean;
  onToolSelect: (toolId: string) => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const SUBCATEGORY_ORDER: ToolSubcategory[] = ["media_creation", "store_growth", "social_content", "utility"];

export function StudioHomeBanner({ creditBalance, isLoadingCredits, onToolSelect }: StudioHomeBannerProps) {
  const quickTools = toolsRegistry.filter(t => t.category === "quick_tool" && t.isActive);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="p-6 lg:p-10 space-y-10 max-w-[1400px] mx-auto"
    >
      {SUBCATEGORY_ORDER.map(subcat => {
        const tools = quickTools
          .filter(t => t.subcategory === subcat)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        if (!tools.length) return null;

        return (
          <motion.div key={subcat} variants={fadeUp} className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {SUBCATEGORY_LABELS[subcat]}
              </h2>
              <button className="text-sm text-slate-400 hover:text-blue-500 transition-colors flex items-center gap-1">
                More <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {tools.map(tool => {
                const Icon = tool.icon;
                const thumb = toolThumbnails[tool.id];

                return (
                  <button
                    key={tool.id}
                    onClick={() => !tool.comingSoon && onToolSelect(tool.id)}
                    className={cn(
                      "group relative flex flex-row items-stretch rounded-2xl text-left overflow-hidden",
                      "bg-white border border-[#e3edf5]",
                      "shadow-sm",
                      "hover:border-blue-300 hover:shadow-md hover:-translate-y-1",
                      "transition-all duration-250",
                      tool.comingSoon && "opacity-50 cursor-default"
                    )}
                  >
                    <div className="w-[3px] shrink-0 bg-blue-400/60 group-hover:bg-blue-500 transition-colors" />

                    <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                      <p className="text-[13px] font-bold text-blue-500 leading-tight truncate">
                        {tool.name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {tool.description}
                      </p>
                      {tool.comingSoon && (
                        <span className="inline-block mt-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Coming Soon
                        </span>
                      )}
                    </div>

                    <div className="w-20 h-20 shrink-0 overflow-hidden self-center mr-2 rounded-xl bg-[#f4f9fd]">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={tool.name}
                          loading="lazy"
                          width={80}
                          height={80}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon className="h-7 w-7 text-slate-300" />
                        </div>
                      )}
                    </div>

                    {tool.isPro && (
                      <div className="absolute top-2 left-5">
                        <Sparkles className="h-3 w-3 text-blue-400/60" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
