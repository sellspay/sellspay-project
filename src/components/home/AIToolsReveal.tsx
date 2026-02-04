import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

type Card = { id: string; src: string; alt?: string };

export function AIToolsReveal() {
  const navigate = useNavigate();

  // Placeholder cards - replace with your real assets
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
      { bg: "#05060B", accent: "#7C5CFF" },
      { bg: "#0B1020", accent: "#3DBBFF" },
      { bg: "#140A18", accent: "#FF4C9A" },
      { bg: "#070A12", accent: "#FF6A2A" },
    ],
    []
  );

  const [themeIndex, setThemeIndex] = useState(0);
  const [stack, setStack] = useState(cards);

  // Auto-cycle themes and cards every 1.8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setThemeIndex((i) => (i + 1) % themes.length);

      setStack((prev) => {
        const next = [...prev];
        const first = next.shift();
        if (first) next.push(first);
        return next;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [themes.length]);

  const theme = themes[themeIndex];

  return (
    <section className="relative min-h-[85vh] overflow-hidden">
      {/* Animated background */}
      <motion.div
        className="absolute inset-0"
        animate={{ backgroundColor: theme.bg }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />

      {/* Vignette overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-50 [background:radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.75)_100%)]" />

      <div className="relative z-10 mx-auto grid h-full max-w-7xl grid-cols-1 gap-8 px-6 py-16 md:grid-cols-2 md:items-center md:py-20 lg:gap-12 lg:py-24">
        {/* Left text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col justify-center"
        >
          <motion.h1
            className="text-5xl font-semibold tracking-tight md:text-6xl lg:text-7xl"
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
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Professional AI tools for modern creators. Generate SFX, isolate vocals,
            create images, and more — all in one place.
          </motion.p>

          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              size="lg"
              onClick={() => navigate("/tools")}
              className="h-auto py-4 px-12 text-lg rounded-none"
            >
              Explore Tools
            </Button>
          </motion.div>
        </motion.div>

        {/* Right card frame */}
        <motion.div
          className="relative flex items-center justify-center"
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <GlassFrame>
            <div className="relative h-[280px] w-full overflow-hidden rounded-[22px] sm:h-[320px] md:h-[380px]">
              {/* Animated waveform background */}
              <Waveform accent={theme.accent} />

              {/* Card stack - cycles automatically */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-[180px] w-[280px] sm:h-[220px] sm:w-[360px] md:h-[260px] md:w-[420px]">
                  <AnimatePresence mode="popLayout">
                    {stack.slice(0, 3).map((card, i) => (
                      <motion.img
                        key={card.id}
                        src={card.src}
                        alt={card.alt ?? ""}
                        className="absolute left-1/2 top-1/2 h-full w-full rounded-2xl object-cover bg-white/10"
                        initial={{ 
                          x: "-50%", 
                          y: "-50%",
                          scale: 0.9,
                          opacity: 0 
                        }}
                        animate={{
                          x: "-50%",
                          y: `calc(-50% + ${i * 12}px)`,
                          scale: 1 - i * 0.04,
                          opacity: 1 - i * 0.15,
                          zIndex: 30 - i,
                        }}
                        exit={{
                          x: "100%",
                          y: "-50%",
                          opacity: 0,
                          scale: 0.8,
                        }}
                        transition={{ duration: 0.55, ease: "easeOut" }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Prompt box */}
              <PromptBox accent={theme.accent} />
            </div>
          </GlassFrame>
        </motion.div>
      </div>
    </section>
  );
}

function GlassFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full max-w-[600px] rounded-[28px] border border-white/15 bg-white/5 p-3 shadow-[0_0_90px_rgba(255,255,255,0.10)] backdrop-blur-xl sm:p-4">
      {/* inner border */}
      <div className="pointer-events-none absolute inset-2 rounded-[22px] border border-white/10" />
      {/* shine sweep */}
      <motion.div
        className="pointer-events-none absolute -inset-24 opacity-20"
        animate={{ x: ["-30%", "130%"] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "linear" }}
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

function Waveform({ accent }: { accent: string }) {
  return (
    <motion.div
      className="absolute inset-0"
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      style={{
        background: `radial-gradient(circle at 30% 40%, ${accent}44 0%, transparent 50%),
                     radial-gradient(circle at 70% 60%, ${accent}33 0%, transparent 50%)`,
      }}
    />
  );
}

function PromptBox({ accent }: { accent: string }) {
  return (
    <motion.div
      className="absolute bottom-3 left-1/2 w-[92%] max-w-[520px] -translate-x-1/2 rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-white/85 shadow-[0_15px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:bottom-4 sm:px-5 sm:py-4"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.55, ease: "easeOut", delay: 0.2 }}
    >
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 sm:h-10 sm:w-10">
            🔊
          </div>
          <motion.div
            className="text-sm font-medium sm:text-base"
            animate={{ color: accent }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            Generate your SFX…
          </motion.div>
        </div>
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 sm:h-10 sm:w-10">
          ⬆️
        </div>
      </div>
    </motion.div>
  );
}
