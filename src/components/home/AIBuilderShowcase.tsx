import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import aiBuilderResult from '@/assets/ai-builder-result.jpg';

type Phase = 'idle' | 'generating' | 'done';

const PROMPT_TEXT = 'Build me a luxury fashion boutique with dark theme, gold accents, hero video section, and a product grid with hover effects';

const progressSteps = [
  'Analyzing brand direction...',
  'Generating layout structure...',
  'Applying design tokens...',
  'Building product grid...',
  'Finalizing storefront...',
];

export function AIBuilderShowcase() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [typed, setTyped] = useState('');
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const hasAnimated = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Auto-type on scroll into view
  useEffect(() => {
    if (hasAnimated.current) return;
    const el = sectionRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          startSequence();
          obs.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const startSequence = () => {
    // Phase 1: type the prompt
    let i = 0;
    const typeInterval = setInterval(() => {
      i++;
      setTyped(PROMPT_TEXT.slice(0, i));
      if (i >= PROMPT_TEXT.length) {
        clearInterval(typeInterval);
        // small pause then start generating
        setTimeout(() => {
          setPhase('generating');
          animateGeneration();
        }, 600);
      }
    }, 28);
  };

  const animateGeneration = () => {
    let p = 0;
    let step = 0;
    const interval = setInterval(() => {
      p += 2;
      setProgress(Math.min(p, 100));

      const newStep = Math.min(Math.floor(p / 20), progressSteps.length - 1);
      if (newStep !== step) {
        step = newStep;
        setStepIdx(step);
      }

      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => setPhase('done'), 400);
      }
    }, 60);
  };

  const handleReplay = () => {
    setPhase('idle');
    setTyped('');
    setStepIdx(0);
    setProgress(0);
    hasAnimated.current = false;
    setTimeout(() => {
      hasAnimated.current = true;
      startSequence();
    }, 300);
  };

  return (
    <section
      ref={sectionRef}
      className="studio-dark relative overflow-hidden bg-background py-28 sm:py-36 lg:py-44"
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-20 h-[380px] w-[380px] -translate-x-1/2 rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.22) 0%, transparent 70%)' }}
        />
        <div
          className="absolute left-1/2 top-40 h-[500px] w-[900px] -translate-x-1/2 rounded-full blur-[180px]"
          style={{ background: 'radial-gradient(circle, hsl(var(--ring) / 0.1) 0%, transparent 72%)' }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-[920px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-Powered
          </div>

          <h2 className="mt-6 text-[clamp(3rem,8vw,6.5rem)] font-black leading-[0.9] tracking-[-0.07em] text-foreground">
            AI Builder
          </h2>

          <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
            Type a prompt. Watch the storefront generate in real-time.
          </p>
        </motion.div>

        {/* Central showcase card */}
        <div className="mx-auto mt-12 sm:mt-14">
          <div
            className="relative overflow-hidden rounded-[32px] border border-border/70 bg-card/80 backdrop-blur-xl"
            style={{ boxShadow: '0 40px 120px -56px hsl(var(--primary) / 0.4)' }}
          >
            <AnimatePresence mode="wait">
              {/* ─── IDLE + GENERATING: Prompt UI ─── */}
              {phase !== 'done' && (
                <motion.div
                  key="prompt-phase"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.4 }}
                  className="p-6 sm:p-8 lg:p-10"
                >
                  {/* Fake chat input */}
                  <div className="rounded-[24px] border border-border/70 bg-background/80 p-5 sm:p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg shadow-primary/25">
                        AI
                      </div>
                      <div className="flex gap-2">
                        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
                          Storefront
                        </span>
                        <span className="rounded-full border border-border/70 bg-card/60 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                          Landing Page
                        </span>
                      </div>
                    </div>

                    <div className="min-h-[72px] rounded-[20px] border border-border/70 bg-background/60 p-4">
                      <p className="text-sm leading-6 text-foreground/80 sm:text-base">
                        {typed}
                        {phase === 'idle' && (
                          <span className="ml-0.5 inline-block h-5 w-[2px] animate-pulse bg-primary align-middle" />
                        )}
                      </p>
                    </div>

                    {/* Send button area */}
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground">
                        {phase === 'idle' ? 'Describe your storefront...' : ''}
                      </p>
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${
                          phase === 'generating'
                            ? 'bg-primary/20 text-primary'
                            : typed.length > 0
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                            : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {phase === 'generating' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Generation progress */}
                  <AnimatePresence>
                    {phase === 'generating' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-6 space-y-4">
                          {/* Progress bar */}
                          <div className="flex items-center gap-4">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                              <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-ring"
                                style={{ width: `${progress}%` }}
                                transition={{ duration: 0.1 }}
                              />
                            </div>
                            <span className="min-w-[40px] text-right text-xs font-bold tabular-nums text-primary">
                              {progress}%
                            </span>
                          </div>

                          {/* Step indicator */}
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                            <span className="text-xs font-medium text-muted-foreground">
                              {progressSteps[stepIdx]}
                            </span>
                          </div>

                          {/* Step dots */}
                          <div className="flex gap-2">
                            {progressSteps.map((_, i) => (
                              <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                  i <= stepIdx ? 'bg-primary' : 'bg-secondary'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ─── DONE: Generated result ─── */}
              {phase === 'done' && (
                <motion.div
                  key="result-phase"
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Success badge */}
                  <div className="flex items-center justify-between border-b border-border/70 bg-background/60 px-5 py-3 sm:px-7">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
                        Storefront Generated
                      </span>
                    </div>
                    <button
                      onClick={handleReplay}
                      className="rounded-full border border-border/70 bg-card/60 px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Replay ↻
                    </button>
                  </div>

                  {/* Generated storefront preview */}
                  <div className="relative aspect-[16/10] overflow-hidden sm:aspect-[16/9]">
                    <img
                      src={showcaseVibes}
                      alt="AI-generated storefront showcase with multiple design styles"
                      className="h-full w-full object-cover"
                      width={1280}
                      height={720}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

                    {/* Overlay info */}
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                      <div className="rounded-[22px] border border-border/70 bg-background/80 p-5 backdrop-blur-xl">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                          Your storefront is ready
                        </p>
                        <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
                          Luxury Fashion Boutique — Dark & Gold
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Hero video, product grid, hover effects — all generated from your prompt.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Stats row */}
        <div className="mx-auto mt-6 grid max-w-[720px] grid-cols-3 gap-3">
          {[
            { value: '10s', label: 'avg. build' },
            { value: '∞', label: 'styles' },
            { value: '0', label: 'code needed' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-[20px] border border-border/70 bg-card/60 p-4 text-center backdrop-blur-xl"
            >
              <div className="text-xl font-black tracking-[-0.04em] text-foreground sm:text-2xl">
                {stat.value}
              </div>
              <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 text-center sm:mt-12"
        >
          <Button
            asChild
            className="h-14 rounded-full border border-primary/30 bg-primary px-10 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90"
          >
            <Link to="/ai-builder">
              Start Building
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            No code required · free to start
          </p>
        </motion.div>
      </div>
    </section>
  );
}
