import { motion } from "framer-motion";

import nanoBananaLogo from "@/assets/logos/nano-banana.png";

interface NanoBananaViewProps {
  displayedText?: string;
}

export function NanoBananaView({ displayedText }: NanoBananaViewProps) {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0, scale: 0.995 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.995 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/10 via-transparent to-muted/10" />

      <div className="relative h-full w-full flex items-center justify-center">
        <div className="text-center px-6">
          <div className="mx-auto w-20 sm:w-24 lg:w-28">
            <img
              src={nanoBananaLogo}
              alt="Nano Banana"
              className="w-full h-auto object-contain"
              loading="lazy"
            />
          </div>
          <h3 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-serif italic text-foreground tracking-tight">
            Generate Anything
          </h3>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-lg mx-auto">
            A playful, everything-mode generator—perfect for wild concepts, style mashups, and quick ideation.
          </p>

          {displayedText ? (
            <div className="mt-6 mx-auto max-w-xl">
              <div className="border border-foreground/10 bg-card/40 backdrop-blur-sm px-4 py-3">
                <p className="text-sm sm:text-base text-foreground/90 font-medium">
                  {displayedText}
                  <span className="inline-block w-2 align-baseline animate-pulse">|</span>
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
