import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, MotionValue } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const BEATS = 6; // how many reveal steps

export function AIToolsReveal() {
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end start"],
  });

  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 20 });

  // Beat helper: split the progress into segments
  const beat = (i: number) => i / BEATS;

  // Beat 0-1: Card fades in
  const cardOpacity = useTransform(p, [beat(0), beat(1)], [0, 1]);
  const cardY = useTransform(p, [beat(0), beat(1)], [60, 0]);

  // Beat 1-2: Text reveals
  const textOpacity = useTransform(p, [beat(1), beat(2)], [0, 1]);
  const textY = useTransform(p, [beat(1), beat(2)], [30, 0]);

  // Beat 2-3: Background shifts
  const bg = useTransform(
    p,
    [0, beat(2), beat(4), 1],
    ["#05060B", "#0B1020", "#140A18", "#070A12"]
  );

  // Beat 2-4: Accent color changes
  const accent = useTransform(
    p,
    [0, beat(2), beat(4), 1],
    ["#7C5CFF", "#3DBBFF", "#FF4C9A", "#FF6A2A"]
  );

  // Beat 3-4: Prompt box slides in
  const promptOpacity = useTransform(p, [beat(3), beat(4)], [0, 1]);
  const promptY = useTransform(p, [beat(3), beat(4)], [20, 0]);

  // Beat 4-5: Card parallax effect
  const cardParallax1 = useTransform(p, [beat(4), beat(6)], [0, -30]);
  const cardParallax2 = useTransform(p, [beat(4), beat(6)], [0, -15]);
  const cardRot1 = useTransform(p, [beat(4), beat(6)], [0, 3]);
  const cardRot2 = useTransform(p, [beat(4), beat(6)], [0, -3]);

  // Beat 5-6: Button reveals
  const buttonOpacity = useTransform(p, [beat(5), beat(6)], [0, 1]);
  const buttonY = useTransform(p, [beat(5), beat(6)], [20, 0]);

  // Frame scale
  const frameScale = useTransform(p, [beat(0), beat(1), beat(5), 1], [0.95, 1, 1, 0.98]);

  return (
    <section 
      ref={wrapRef} 
      className="relative" 
      style={{ height: `${(BEATS + 1) * 100}vh` }}
    >
      {/* This is the pinned stage */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Scroll-driven background */}
        <motion.div className="absolute inset-0" style={{ backgroundColor: bg }} />

        {/* vignette */}
        <div className="pointer-events-none absolute inset-0 opacity-50 [background:radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.75)_100%)]" />

        <div className="relative z-10 mx-auto grid h-full max-w-7xl grid-cols-1 gap-6 px-6 py-12 md:grid-cols-2 md:items-center lg:gap-10">
          {/* Left text */}
          <motion.div 
            style={{ opacity: textOpacity, y: textY }}
            className="flex flex-col justify-center"
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
                onClick={() => navigate('/tools')}
                className="h-auto py-4 px-12 text-lg rounded-none"
              >
                Explore Tools
              </Button>
            </motion.div>
          </motion.div>

          {/* Right frame */}
          <motion.div
            className="relative flex items-center justify-center"
            style={{ opacity: cardOpacity, y: cardY, scale: frameScale }}
          >
            <GlassFrame>
              <div className="relative h-[280px] w-full overflow-hidden rounded-[22px] sm:h-[320px] md:h-[380px]">
                {/* Cards with parallax (placeholders - replace with your PNGs) */}
                <motion.img
                  src="/placeholder.svg"
                  className="absolute left-3 top-3 h-[100px] w-[140px] rounded-2xl object-cover bg-white/10 sm:left-4 sm:top-4 sm:h-[120px] sm:w-[170px] md:left-6 md:top-6 md:h-[140px] md:w-[200px]"
                  style={{ y: cardParallax1, rotate: cardRot1 }}
                  alt="Tool 1"
                />
                <motion.img
                  src="/placeholder.svg"
                  className="absolute right-3 top-3 h-[100px] w-[140px] rounded-2xl object-cover bg-white/10 sm:right-4 sm:top-4 sm:h-[120px] sm:w-[170px] md:right-6 md:top-6 md:h-[140px] md:w-[200px]"
                  style={{ y: cardParallax2, rotate: cardRot2 }}
                  alt="Tool 2"
                />
                <motion.img
                  src="/placeholder.svg"
                  className="absolute left-3 bottom-16 h-[100px] w-[140px] rounded-2xl object-cover bg-white/10 sm:left-4 sm:bottom-18 sm:h-[120px] sm:w-[170px] md:left-6 md:bottom-20 md:h-[140px] md:w-[200px]"
                  style={{ y: cardParallax2 }}
                  alt="Tool 3"
                />
                <motion.img
                  src="/placeholder.svg"
                  className="absolute right-3 bottom-16 h-[100px] w-[140px] rounded-2xl object-cover bg-white/10 sm:right-4 sm:bottom-18 sm:h-[120px] sm:w-[170px] md:right-6 md:bottom-20 md:h-[140px] md:w-[200px]"
                  style={{ y: cardParallax1 }}
                  alt="Tool 4"
                />

                {/* prompt box (reveals at beat 3-4) */}
                <PromptBox accent={accent} opacity={promptOpacity} y={promptY} />
              </div>
            </GlassFrame>
          </motion.div>
        </div>
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

interface PromptBoxProps {
  accent: MotionValue<string>;
  opacity: MotionValue<number>;
  y: MotionValue<number>;
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
          <motion.div style={{ color: accent }} className="text-sm font-medium sm:text-base">
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
