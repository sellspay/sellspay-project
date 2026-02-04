import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function AIToolsReveal() {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement | null>(null);

  // Scroll progress for this section (normal scroll, no pin)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Smooth the progress
  const p = useSpring(scrollYProgress, { stiffness: 100, damping: 25 });

  // BACKGROUND COLOR changes on scroll
  const bg = useTransform(
    p,
    [0, 0.3, 0.6, 1],
    ["#05060B", "#0B1020", "#140A18", "#070A12"]
  );

  // Accent/text color changes on scroll
  const accent = useTransform(
    p,
    [0, 0.3, 0.6, 1],
    ["#7C5CFF", "#3DBBFF", "#FF4C9A", "#FF6A2A"]
  );

  // Text reveal (fade in as section enters view)
  const textOpacity = useTransform(p, [0, 0.15, 0.25], [0, 0, 1]);
  const textY = useTransform(p, [0, 0.15, 0.25], [40, 40, 0]);

  // Frame reveal
  const frameOpacity = useTransform(p, [0.05, 0.2, 0.3], [0, 0, 1]);
  const frameY = useTransform(p, [0.05, 0.2, 0.3], [60, 60, 0]);
  const frameScale = useTransform(p, [0.2, 0.35], [0.95, 1]);

  // Card motion - lateral slide + parallax (both directions based on scroll)
  const card1X = useTransform(p, [0.2, 0.8], [-60, 40]);
  const card1Y = useTransform(p, [0.2, 0.8], [30, -20]);
  const card1Rot = useTransform(p, [0.2, 0.8], [-4, 3]);

  const card2X = useTransform(p, [0.2, 0.8], [60, -40]);
  const card2Y = useTransform(p, [0.2, 0.8], [20, -15]);
  const card2Rot = useTransform(p, [0.2, 0.8], [4, -3]);

  const card3X = useTransform(p, [0.2, 0.8], [-40, 30]);
  const card3Y = useTransform(p, [0.2, 0.8], [15, -25]);

  const card4X = useTransform(p, [0.2, 0.8], [40, -30]);
  const card4Y = useTransform(p, [0.2, 0.8], [10, -20]);

  // Prompt box reveal
  const promptOpacity = useTransform(p, [0.25, 0.4], [0, 1]);
  const promptY = useTransform(p, [0.25, 0.4], [20, 0]);

  // Button reveal
  const buttonOpacity = useTransform(p, [0.3, 0.45], [0, 1]);
  const buttonY = useTransform(p, [0.3, 0.45], [20, 0]);

  return (
    <section ref={ref} className="relative min-h-[90vh] overflow-hidden">
      {/* Scroll-driven background */}
      <motion.div className="absolute inset-0" style={{ backgroundColor: bg }} />

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 opacity-50 [background:radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.75)_100%)]" />

      <div className="relative z-10 mx-auto grid h-full min-h-[90vh] max-w-7xl grid-cols-1 gap-8 px-6 py-16 md:grid-cols-2 md:items-center md:py-20 lg:gap-12 lg:py-24">
        {/* Left text - reveals on scroll */}
        <motion.div
          className="flex flex-col justify-center"
          style={{ opacity: textOpacity, y: textY }}
        >
          <motion.h1
            className="text-5xl font-semibold tracking-tight md:text-6xl lg:text-7xl"
            style={{ color: accent }}
          >
            AI Studio
          </motion.h1>

          <p className="mt-4 text-lg leading-relaxed text-white/80 md:text-xl">
            Professional AI tools for modern creators. Generate SFX, isolate vocals,
            create images, and more — all in one place.
          </p>

          <motion.div
            className="mt-8"
            style={{ opacity: buttonOpacity, y: buttonY }}
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

        {/* Right card frame - reveals on scroll */}
        <motion.div
          className="relative flex items-center justify-center"
          style={{ opacity: frameOpacity, y: frameY, scale: frameScale }}
        >
          <GlassFrame>
            <div className="relative h-[280px] w-full overflow-hidden rounded-[22px] sm:h-[320px] md:h-[380px]">
              {/* Animated waveform background */}
              <Waveform accent={accent} />

              {/* Cards with lateral + parallax motion */}
              <motion.img
                src="/placeholder.svg"
                className="absolute left-3 top-3 h-[100px] w-[140px] rounded-2xl object-cover bg-white/10 sm:left-4 sm:top-4 sm:h-[120px] sm:w-[170px] md:left-6 md:top-6 md:h-[140px] md:w-[200px]"
                style={{ x: card1X, y: card1Y, rotate: card1Rot }}
                alt="Tool 1"
              />
              <motion.img
                src="/placeholder.svg"
                className="absolute right-3 top-3 h-[100px] w-[140px] rounded-2xl object-cover bg-white/10 sm:right-4 sm:top-4 sm:h-[120px] sm:w-[170px] md:right-6 md:top-6 md:h-[140px] md:w-[200px]"
                style={{ x: card2X, y: card2Y, rotate: card2Rot }}
                alt="Tool 2"
              />
              <motion.img
                src="/placeholder.svg"
                className="absolute left-3 bottom-16 h-[100px] w-[140px] rounded-2xl object-cover bg-white/10 sm:left-4 sm:bottom-18 sm:h-[120px] sm:w-[170px] md:left-6 md:bottom-20 md:h-[140px] md:w-[200px]"
                style={{ x: card3X, y: card3Y }}
                alt="Tool 3"
              />
              <motion.img
                src="/placeholder.svg"
                className="absolute right-3 bottom-16 h-[100px] w-[140px] rounded-2xl object-cover bg-white/10 sm:right-4 sm:bottom-18 sm:h-[120px] sm:w-[170px] md:right-6 md:bottom-20 md:h-[140px] md:w-[200px]"
                style={{ x: card4X, y: card4Y }}
                alt="Tool 4"
              />

              {/* Prompt box - reveals on scroll */}
              <PromptBox accent={accent} opacity={promptOpacity} y={promptY} />
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

function Waveform({ accent }: { accent: any }) {
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        background: useTransform(accent, (a: string) => 
          `radial-gradient(circle at 30% 40%, ${a}44 0%, transparent 50%),
           radial-gradient(circle at 70% 60%, ${a}33 0%, transparent 50%)`
        ),
      }}
    />
  );
}

interface PromptBoxProps {
  accent: any;
  opacity: any;
  y: any;
}

function PromptBox({ accent, opacity, y }: PromptBoxProps) {
  return (
    <motion.div
      className="absolute bottom-3 left-1/2 w-[92%] max-w-[520px] -translate-x-1/2 rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-white/85 shadow-[0_15px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:bottom-4 sm:px-5 sm:py-4"
      style={{ opacity, y }}
    >
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 sm:h-10 sm:w-10">
            🔊
          </div>
          <motion.div
            className="text-sm font-medium sm:text-base"
            style={{ color: accent }}
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
