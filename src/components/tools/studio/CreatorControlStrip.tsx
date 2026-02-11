import { motion } from "framer-motion";
import { Package, Layers, Sparkles, Coins } from "lucide-react";

interface CreatorControlStripProps {
  productCount: number;
  assetCount: number;
  generationCount: number;
  creditBalance: number;
}

const stats = [
  { key: "products", icon: Package, label: "Products" },
  { key: "assets", icon: Layers, label: "Assets" },
  { key: "generations", icon: Sparkles, label: "Generated" },
  { key: "credits", icon: Coins, label: "Credits" },
] as const;

export function CreatorControlStrip({ productCount, assetCount, generationCount, creditBalance }: CreatorControlStripProps) {
  const values: Record<string, number> = {
    products: productCount,
    assets: assetCount,
    generations: generationCount,
    credits: creditBalance,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6"
    >
      <div className="flex items-center justify-between gap-4 px-6 py-4 rounded-xl bg-card/30 backdrop-blur-xl border border-border/20 overflow-x-auto">
        {stats.map((s, i) => (
          <div key={s.key} className="flex items-center gap-3 min-w-fit">
            {i > 0 && <div className="w-px h-8 bg-border/20 shrink-0 hidden sm:block" />}
            <s.icon className="h-4 w-4 text-primary/70 shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground tabular-nums">{values[s.key]}</span>
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
