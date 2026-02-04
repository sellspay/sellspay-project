import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

type Card = { id: string; src: string; alt?: string };

export function AIToolsReveal() {
  const navigate = useNavigate();

  // Placeholder cards - user will replace with real assets
  const cards: Card[] = useMemo(
    () => [
      { id: "c1", src: "/placeholder.svg", alt: "Tool 1" },
      { id: "c2", src: "/placeholder.svg", alt: "Tool 2" },
      { id: "c3", src: "/placeholder.svg", alt: "Tool 3" },
      { id: "c4", src: "/placeholder.svg", alt: "Tool 4" },
    ],
    []
  );

  // Background + text color cycling themes
  const themes = useMemo(
    () => [
      { bg: "hsl(230, 35%, 5%)", accent: "hsl(262, 83%, 75%)" },
      { bg: "hsl(20, 100%, 92%)", accent: "hsl(220, 100%, 50%)" },
      { bg: "hsl(235, 35%, 8%)", accent: "hsl(340, 100%, 64%)" },
      { bg: "hsl(0, 0%, 96%)", accent: "hsl(14, 100%, 50%)" },
    ],
    []
  );

  const [themeIndex, setThemeIndex] = useState(0);
  const [stack, setStack] = useState(cards);

  // Rotate background + rotate card stack
  useEffect(() => {
    const t = setInterval(() => {
      setThemeIndex((i) => (i + 1) % themes.length);

      setStack((prev) => {
        const next = [...prev];
        const first = next.shift();
        if (first) next.push(first);
        return next;
      });
    }, 1800);

    return () => clearInterval(t);
  }, [themes.length]);

  const theme = themes[themeIndex];

  return (
    <section className="relative min-h-[80vh] overflow-hidden">
      {/* Animated background */}
      <motion.div
        className="absolute inset-0"
        animate={{ backgroundColor: theme.bg }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />

      {/* Subtle vignette */}
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.65)_100%)]" />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-10 px-6 py-16 md:flex-row md:items-center md:justify-between lg:py-24">
        {/* Left copy */}
        <div className="max-w-xl">
          <motion.h1
            className="text-balance text-5xl font-semibold tracking-tight md:text-6xl lg:text-7xl"
            animate={{ color: theme.accent }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            AI Studio
          </motion.h1>

          <motion.p
            className="mt-4 text-lg leading-relaxed text-white/80 md:text-xl"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5 }}
          >
            Professional AI tools for modern creators. Generate SFX, isolate vocals, 
            create images, and more — all in one place.
          </motion.p>

          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Button
              size="lg"
              onClick={() => navigate('/tools')}
              className="h-auto py-4 px-12 text-lg rounded-none"
            >
              Explore Tools
            </Button>
          </motion.div>
        </div>

        {/* Right UI card */}
        <motion.div
          className="relative w-full max-w-[640px]"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        >
          <GlassFrame>
            {/* Waveform area */}
            <div className="relative h-[320px] w-full overflow-hidden rounded-[22px] md:h-[380px]">
              <motion.div
                className="absolute inset-0 opacity-80"
                animate={{ filter: ["blur(0px)", "blur(1.5px)", "blur(0px)"] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />

              <Waveform accent={theme.accent} />

              {/* Card stack */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-[200px] w-[340px] md:h-[260px] md:w-[420px]">
                  {stack.slice(0, 3).map((card, i) => (
                    <motion.img
                      key={card.id}
                      src={card.src}
                      alt={card.alt ?? ""}
                      className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-2xl object-cover bg-white/10"
                      style={{
                        zIndex: 30 - i,
                      }}
                      animate={{
                        y: i * 10,
                        scale: 1 - i * 0.04,
                        opacity: 1 - i * 0.12,
                      }}
                      transition={{ duration: 0.55, ease: "easeOut" }}
                    />
                  ))}
                </div>
              </div>

              {/* Prompt box overlay */}
              <PromptBox />
            </div>
          </GlassFrame>
        </motion.div>
      </div>
    </section>
  );
}

/** Glossy frame wrapper */
function GlassFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-[28px] border border-white/15 bg-white/5 p-4 shadow-[0_0_90px_rgba(255,255,255,0.10)] backdrop-blur-xl">
      {/* inner border */}
      <div className="pointer-events-none absolute inset-2 rounded-[22px] border border-white/10" />

      {/* animated shine */}
      <motion.div
        className="pointer-events-none absolute -inset-24 opacity-25"
        animate={{ x: ["-30%", "130%"] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "linear" }}
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
          transform: "rotate(10deg)",
        }}
      />

      <div className="relative">{children}</div>
    </div>
  );
}

/** Animated waveform background */
function Waveform({ accent }: { accent: string }) {
  return (
    <motion.div
      className="absolute inset-0"
      animate={{ opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      style={{
        background: `radial-gradient(circle at 30% 40%, ${accent}55 0%, transparent 55%),
                     radial-gradient(circle at 70% 60%, ${accent}40 0%, transparent 55%)`,
      }}
    />
  );
}

function PromptBox() {
  return (
    <motion.div
      className="absolute bottom-4 left-1/2 w-[92%] max-w-[560px] -translate-x-1/2 rounded-2xl border border-white/15 bg-black/35 px-5 py-4 text-white/85 shadow-[0_15px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut", delay: 0.15 }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
            🔊
          </div>
          <div className="text-base">Generate your SFX…</div>
        </div>

        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
          ⬆️
        </div>
      </div>
    </motion.div>
  );
}
