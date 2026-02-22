import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface GenerationOverlayProps {
  visible: boolean;
  phase?: string;
  analysisText?: string;
}

const PHASE_LABELS: Record<string, string> = {
  analyzing: 'Understanding your vision',
  planning: 'Architecting the experience',
  building: 'Generating your storefront',
  reporting: 'Finalizing output',
};

const AMBIENT_MESSAGES = [
  'Crafting layouts & typography…',
  'Designing color palettes…',
  'Building responsive sections…',
  'Wiring interactive elements…',
  'Polishing animations…',
  'Structuring component hierarchy…',
  'Assembling your vision…',
];

export function GenerationOverlay({ visible, phase, analysisText }: GenerationOverlayProps) {
  const [ambientIdx, setAmbientIdx] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setAmbientIdx(prev => (prev + 1) % AMBIENT_MESSAGES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [visible]);

  const label = phase && PHASE_LABELS[phase] ? PHASE_LABELS[phase] : AMBIENT_MESSAGES[ambientIdx];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6 } }}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950 overflow-hidden"
        >
          {/* Animated gradient orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute w-[600px] h-[600px] rounded-full opacity-[0.07]"
              style={{
                background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
                left: '20%',
                top: '30%',
              }}
              animate={{
                x: [0, 80, -40, 0],
                y: [0, -60, 40, 0],
                scale: [1, 1.2, 0.9, 1],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute w-[500px] h-[500px] rounded-full opacity-[0.05]"
              style={{
                background: 'radial-gradient(circle, hsl(260 80% 60%) 0%, transparent 70%)',
                right: '15%',
                bottom: '20%',
              }}
              animate={{
                x: [0, -60, 30, 0],
                y: [0, 50, -30, 0],
                scale: [1, 0.85, 1.15, 1],
              }}
              transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Center content */}
          <div className="relative z-10 flex flex-col items-center gap-8 max-w-md px-6">
            {/* Animated ring spinner */}
            <div className="relative w-20 h-20">
              {/* Outer ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              />
              {/* Active arc */}
              <svg className="absolute inset-0 w-20 h-20" viewBox="0 0 80 80">
                <motion.circle
                  cx="40"
                  cy="40"
                  r="38"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="60 180"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: 'center' }}
                />
              </svg>
              {/* Inner glow dot */}
              <motion.div
                className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-primary"
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>

            {/* Phase label */}
            <div className="text-center space-y-3">
              <AnimatePresence mode="wait">
                <motion.p
                  key={label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                  className="text-base font-medium text-white/90 tracking-wide"
                >
                  {label}
                </motion.p>
              </AnimatePresence>

              {/* Analysis text snippet */}
              {analysisText && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-zinc-500 max-w-xs mx-auto line-clamp-2 leading-relaxed"
                >
                  {analysisText.slice(0, 120)}{analysisText.length > 120 ? '…' : ''}
                </motion.p>
              )}
            </div>

            {/* Progress dots */}
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-1 rounded-full bg-primary/60"
                  animate={{
                    scale: [1, 1.8, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
