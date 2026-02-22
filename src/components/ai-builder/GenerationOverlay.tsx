import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

interface GenerationOverlayProps {
  visible: boolean;
  phase?: string;
  analysisText?: string;
}

/**
 * Phase-aware labels that match the AI pipeline stages.
 * The overlay cycles through contextual messages within each phase.
 */
const PHASE_MESSAGES: Record<string, string[]> = {
  analyzing: [
    'Understanding your vision',
    'Analyzing design requirements',
    'Identifying key elements',
    'Parsing your request',
  ],
  planning: [
    'Architecting the experience',
    'Designing component structure',
    'Planning layout hierarchy',
    'Mapping interactive elements',
  ],
  building: [
    'Generating your storefront',
    'Writing React components',
    'Building responsive sections',
    'Wiring interactive elements',
    'Crafting layouts & typography',
    'Applying color palettes',
    'Polishing animations',
    'Assembling your vision',
    'Structuring CSS styles',
    'Creating navigation flow',
  ],
  reporting: [
    'Finalizing output',
    'Running quality checks',
    'Preparing preview',
  ],
};

const FALLBACK_MESSAGES = [
  'Working on your design',
  'Crafting layouts & typography',
  'Building responsive sections',
  'Wiring interactive elements',
  'Polishing animations',
];

export function GenerationOverlay({ visible, phase, analysisText }: GenerationOverlayProps) {
  const [msgIdx, setMsgIdx] = useState(0);
  const prevPhaseRef = useRef(phase);

  // Reset message index when phase changes so we start fresh
  useEffect(() => {
    if (phase !== prevPhaseRef.current) {
      setMsgIdx(0);
      prevPhaseRef.current = phase;
    }
  }, [phase]);

  // Cycle through messages for the current phase
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setMsgIdx(prev => {
        const messages = (phase && PHASE_MESSAGES[phase]) || FALLBACK_MESSAGES;
        return (prev + 1) % messages.length;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [visible, phase]);

  const messages = (phase && PHASE_MESSAGES[phase]) || FALLBACK_MESSAGES;
  const label = messages[msgIdx % messages.length];

  // Phase progress indicator
  const phaseOrder = ['analyzing', 'planning', 'building', 'reporting'];
  const currentPhaseIdx = phase ? phaseOrder.indexOf(phase) : 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
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

            {/* Phase label with cycling animation */}
            <div className="text-center space-y-3">
              <AnimatePresence mode="wait">
                <motion.p
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
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

            {/* Phase progress steps */}
            <div className="flex items-center gap-2">
              {phaseOrder.map((p, i) => {
                const isActive = i === currentPhaseIdx;
                const isComplete = i < currentPhaseIdx;
                return (
                  <div key={p} className="flex items-center gap-2">
                    <motion.div
                      className={`w-2 h-2 rounded-full ${
                        isComplete ? 'bg-primary' : isActive ? 'bg-primary' : 'bg-zinc-700'
                      }`}
                      animate={isActive ? {
                        scale: [1, 1.5, 1],
                        opacity: [0.7, 1, 0.7],
                      } : {}}
                      transition={isActive ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}}
                    />
                    {i < phaseOrder.length - 1 && (
                      <div className={`w-6 h-px ${isComplete ? 'bg-primary/50' : 'bg-zinc-800'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
