import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Send, CheckCircle2, Loader2, Zap, Palette, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import aiBuilderFashion from '@/assets/ai-builder-fashion-16x9.jpg';
import aiBuilderGaming from '@/assets/ai-builder-gaming-16x9.jpg';
import aiBuilderOrganic from '@/assets/ai-builder-organic-16x9.jpg';

type Phase = 'idle' | 'generating' | 'done';

const EXAMPLES = [
  {
    prompt: 'Build me a luxury fashion boutique with dark theme, gold accents, hero video section, and a product grid with hover effects',
    image: aiBuilderFashion,
    title: 'Luxury Fashion Boutique',
    subtitle: 'Generated from your prompt · Dark & Gold theme',
  },
  {
    prompt: 'Create a gaming gear store with dark purple and neon cyan colors, RGB keyboard hero banner, and product cards for peripherals with discount badges',
    image: aiBuilderGaming,
    title: 'Gaming Gear Store',
    subtitle: 'Generated from your prompt · Neon & Purple theme',
  },
  {
    prompt: 'Design an organic food marketplace with warm earth tones, farm-to-table hero section, and product cards showing artisan foods with pricing',
    image: aiBuilderOrganic,
    title: 'Organic Food Market',
    subtitle: 'Generated from your prompt · Natural & Warm theme',
  },
];

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
  const [exampleIdx, setExampleIdx] = useState(0);
  const exampleIdxRef = useRef(0);
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
          startSequence(0);
          obs.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Auto-replay every 10 seconds after done
  useEffect(() => {
    if (phase !== 'done') return;
    const timer = setTimeout(() => {
      const nextIdx = (exampleIdxRef.current + 1) % EXAMPLES.length;
      exampleIdxRef.current = nextIdx;
      setExampleIdx(nextIdx);
      setPhase('idle');
      setTyped('');
      setStepIdx(0);
      setProgress(0);
      setTimeout(() => startSequence(nextIdx), 300);
    }, 10000);
    return () => clearTimeout(timer);
  }, [phase]);

  const startSequence = (idx: number) => {
    let i = 0;
    const currentPrompt = EXAMPLES[idx].prompt;
    const typeInterval = setInterval(() => {
      i++;
      setTyped(currentPrompt.slice(0, i));
      if (i >= currentPrompt.length) {
        clearInterval(typeInterval);
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

      <div className="relative mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-8">
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

      </div>

      {/* Showcase area */}
      <div className="relative mt-12 sm:mt-14">
        <AnimatePresence mode="wait">
          {/* ─── IDLE + GENERATING: Small centered chatbox ─── */}
          {phase !== 'done' && (
            <motion.div
              key="prompt-phase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30, scale: 0.96, filter: 'blur(6px)' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-[680px] px-4 sm:px-6"
            >
              <div
                className="rounded-[24px] border border-border/70 bg-card/80 p-5 sm:p-6 backdrop-blur-xl"
                style={{ boxShadow: '0 40px 120px -56px hsl(var(--primary) / 0.4)' }}
              >
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

                <div className="min-h-[56px] rounded-[16px] border border-border/70 bg-background/60 p-4">
                  <p className="text-sm leading-6 text-foreground/80">
                    {typed}
                    {phase === 'idle' && (
                      <span className="ml-0.5 inline-block h-5 w-[2px] animate-pulse bg-primary align-middle" />
                    )}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">
                    {phase === 'idle' ? 'Describe your storefront...' : ''}
                  </p>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                      phase === 'generating'
                        ? 'bg-primary/20 text-primary'
                        : typed.length > 0
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {phase === 'generating' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
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
                      <div className="mt-5 space-y-3">
                        <div className="flex items-center gap-4">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-ring"
                              style={{ width: `${progress}%` }}
                              transition={{ duration: 0.1 }}
                            />
                          </div>
                          <span className="min-w-[36px] text-right text-xs font-bold tabular-nums text-primary">
                            {progress}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          <span className="text-xs font-medium text-muted-foreground">
                            {progressSteps[stepIdx]}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          {progressSteps.map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                i <= stepIdx ? 'bg-primary' : 'bg-secondary'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ─── DONE: Full-width result ─── */}
          {phase === 'done' && (
            <motion.div
              key="result-phase"
              initial={{ opacity: 0, y: 30, scale: 0.97, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-[960px] px-4 sm:px-6"
            >
              {/* Clean result card */}
              <div
                className="overflow-hidden rounded-[24px] border border-border/50 bg-card/60 backdrop-blur-xl"
                style={{ boxShadow: '0 0 80px -20px hsl(var(--primary) / 0.25), 0 30px 60px -30px rgba(0,0,0,0.5)' }}
              >
                {/* Image - clean, no overlays */}
                <div className="relative aspect-[16/9] overflow-hidden bg-card">
                  <img
                    src={EXAMPLES[exampleIdx].image}
                    alt="AI-generated storefront preview"
                    className="h-full w-full object-cover object-center"
                    width={1376}
                    height={768}
                  />
                </div>

                {/* Bottom info bar */}
                <div className="flex items-center justify-between px-6 py-4 sm:px-8 sm:py-5 border-t border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {EXAMPLES[exampleIdx].title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {EXAMPLES[exampleIdx].subtitle}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/ai-builder"
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                  >
                    Customize
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats + CTA in centered container */}
      <div className="relative mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-8">
        {/* Feature highlights */}
        <div className="mx-auto mt-10 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12">
          {[
            { icon: Zap, text: 'Generates in ~10 seconds' },
            { icon: Palette, text: 'Unlimited design styles' },
            { icon: Code2, text: 'Zero code required' },
          ].map((item, i) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 * i }}
              className="flex items-center gap-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <item.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{item.text}</span>
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
