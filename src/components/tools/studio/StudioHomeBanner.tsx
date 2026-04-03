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
      {/* SellsPay Suite - Horizontal visual cards like OpenArt */}
      {SUBCATEGORY_ORDER.map(subcat => {
        const tools = quickTools
          .filter(t => t.subcategory === subcat)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        if (!tools.length) return null;

        return (
          <motion.div key={subcat} variants={fadeUp} className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                {SUBCATEGORY_LABELS[subcat]}
              </h2>
              <button className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
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
                      "group relative flex flex-row items-center gap-3 p-3 rounded-xl border border-border/80 bg-background text-left",
                      "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
                      "transition-all duration-200",
                      tool.comingSoon && "opacity-60 cursor-default"
                    )}
                  >
                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary leading-tight truncate">
                        {tool.name.split(" ").map((word, i) => {
                          // Make key action words primary colored, rest foreground
                          const actionWords = ["Generator", "Isolator", "Splitter", "Remover", "Upscaler", "Cleanup", "Converter", "Recorder", "Cutter", "Joiner", "Voiceover", "Script", "Carousel", "Suggestions", "Sections"];
                          if (actionWords.some(aw => word.includes(aw))) {
                            return <span key={i} className="text-primary">{word} </span>;
                          }
                          return <span key={i} className="text-foreground">{word} </span>;
                        })}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {tool.description}
                      </p>
                      {tool.comingSoon && (
                        <span className="inline-block mt-1.5 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                          Coming Soon
                        </span>
                      )}
                    </div>

                    {/* Thumbnail image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted/30 border border-border/50">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={tool.name}
                          loading="lazy"
                          width={64}
                          height={64}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5">
                          <Icon className="h-6 w-6 text-primary/40" />
                        </div>
                      )}
                    </div>

                    {/* Pro badge */}
                    {tool.isPro && (
                      <div className="absolute top-1.5 right-1.5">
                        <Sparkles className="h-3 w-3 text-primary/50" />
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
