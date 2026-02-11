import { motion } from "framer-motion";
import { Flame, BarChart3, Package, Layers, Coins, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MyAssetsDrawer } from "@/components/tools/MyAssetsDrawer";

interface StudioHeroProps {
  creditBalance: number;
  isLoadingCredits: boolean;
  productCount: number;
  assetCount: number;
  onCreatePromo: () => void;
  onOptimizeStore: () => void;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export function StudioHero({
  creditBalance, isLoadingCredits, productCount, assetCount,
  onCreatePromo, onOptimizeStore,
}: StudioHeroProps) {
  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px] animate-glow-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] animate-glow-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full grid lg:grid-cols-2 gap-12 items-center py-16">
        {/* Left */}
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item} className="flex items-center gap-3">
            <MyAssetsDrawer />
          </motion.div>

          <motion.h1 variants={item} className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            AI Studio
          </motion.h1>
          <motion.p variants={item} className="text-lg sm:text-xl text-muted-foreground max-w-md">
            Create. Market. Sell. All in one place.
          </motion.p>
          <motion.p variants={item} className="text-sm text-muted-foreground/70 max-w-md">
            Turn your products into content, traffic, and revenue — instantly.
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap gap-3">
            <Button onClick={onCreatePromo} size="lg" className="btn-premium rounded-full px-6 gap-2 text-sm font-semibold">
              <Flame className="h-4 w-4" /> Create Promo Video
            </Button>
            <Button onClick={onOptimizeStore} variant="outline" size="lg" className="rounded-full px-6 gap-2 text-sm font-semibold border-border/50 hover:bg-card">
              <BarChart3 className="h-4 w-4" /> Optimize My Store
            </Button>
          </motion.div>

          {/* Stat strip */}
          <motion.div variants={item} className="flex flex-wrap gap-3 pt-2">
            {[
              { icon: Package, label: "Products", value: productCount },
              { icon: Layers, label: "AI Assets", value: assetCount },
              { icon: Coins, label: "Credits", value: isLoadingCredits ? "…" : creditBalance },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-card/60 border border-border/40 backdrop-blur-sm">
                <s.icon className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">{s.value}</span>
                <span className="text-[10px] text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right — Phone frame mockup */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="hidden lg:flex justify-center"
        >
          <div className="relative">
            {/* Phone frame */}
            <div className="w-[260px] h-[520px] rounded-[2.5rem] border-2 border-border/30 bg-card/40 backdrop-blur-xl p-3 shadow-2xl shadow-primary/10">
              {/* Notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full bg-background border border-border/30" />
              {/* Screen */}
              <div className="w-full h-full rounded-[2rem] bg-gradient-to-b from-card to-background overflow-hidden flex flex-col items-center justify-center gap-4 p-6">
                <Smartphone className="h-8 w-8 text-primary/40" />
                <div className="space-y-2 w-full">
                  {/* Fake video frame bars */}
                  {[80, 60, 90, 45, 70].map((w, i) => (
                    <motion.div
                      key={i}
                      className="h-3 rounded-full bg-primary/10"
                      style={{ width: `${w}%` }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.6, delay: 0.6 + i * 0.12, ease: "easeOut" }}
                    />
                  ))}
                </div>
                <div className="mt-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <span className="text-[10px] font-semibold text-primary">Your Promo Here</span>
                </div>
              </div>
            </div>
            {/* Glow behind phone */}
            <div className="absolute inset-0 -z-10 rounded-[3rem] bg-primary/10 blur-3xl scale-110" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
