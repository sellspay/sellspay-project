import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import showcaseCode from '@/assets/showcase-code-preview-v2.jpg';
import showcaseVibes from '@/assets/showcase-aesthetics-v2.jpg';

const metrics = [
  { value: '10s', label: 'avg. build time' },
  { value: '∞', label: 'design styles' },
  { value: '0', label: 'code required' },
];

export function AIBuilderShowcase() {
  return (
    <section className="studio-dark relative overflow-hidden bg-background py-28 sm:py-36 lg:py-44">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-28 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-[150px]"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.26) 0%, transparent 68%)' }}
        />
        <div
          className="absolute left-1/2 top-56 h-[540px] w-[900px] -translate-x-1/2 rounded-full blur-[180px]"
          style={{ background: 'radial-gradient(circle, hsl(var(--ring) / 0.12) 0%, transparent 72%)' }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-3xl text-center sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-Powered Storefront Builder
          </div>

          <h2 className="mt-6 text-[clamp(3.2rem,8vw,7rem)] font-black tracking-[-0.08em] leading-[0.9] text-foreground">
            AI Builder
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            Describe the brand, style, and experience — then watch the layout, visuals, and live code come together in one centered build flow.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-[1160px] items-center gap-5 lg:grid-cols-[260px_minmax(0,620px)_260px] lg:gap-6">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="order-2 w-full max-w-[260px] justify-self-center space-y-4 lg:order-1 lg:justify-self-end"
          >
            <div className="rounded-[24px] border border-border/70 bg-card/75 p-5 backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                    Prompt Input
                  </p>
                  <p className="text-xs text-muted-foreground">Natural language → full build</p>
                </div>
              </div>

              <div className="rounded-[20px] border border-border/70 bg-background/80 p-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  <span className="font-medium text-foreground">Build me</span> a luxury storefront with cinematic hero media, premium typography, and elegant product cards.
                </p>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: '0%' }}
                    whileInView={{ width: '100%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 2.2, delay: 0.4, ease: 'easeInOut' }}
                  />
                </div>
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Generating
                </span>
              </div>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-card/60 p-5 backdrop-blur-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">What you get</p>
              <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
                <li>• Live storefront preview</li>
                <li>• Real production-ready code</li>
                <li>• Instant visual direction changes</li>
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="order-1 w-full max-w-[620px] justify-self-center lg:order-2"
          >
            <div
              className="overflow-hidden rounded-[30px] border border-border/80 bg-card/75 backdrop-blur-xl"
              style={{ boxShadow: '0 40px 120px -50px hsl(var(--primary) / 0.45)' }}
            >
              <div className="relative aspect-[16/11] overflow-hidden">
                <img
                  src={showcaseCode}
                  alt="Live code editor with real-time storefront preview"
                  loading="lazy"
                  width={1280}
                  height={720}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/10" />
                <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Live Build
                </div>
              </div>

              <div className="border-t border-border/70 bg-background/85 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                      Prompt to storefront
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                      Centered around the build itself.
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                      The main stage stays locked to the center while the supporting details orbit around it.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-border/70 bg-card px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Real code
                    </span>
                    <span className="rounded-full border border-border/70 bg-card px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Instant preview
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="order-3 w-full max-w-[260px] justify-self-center space-y-4 lg:justify-self-start"
          >
            <div className="overflow-hidden rounded-[24px] border border-border/70 bg-card/70 backdrop-blur-xl">
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={showcaseVibes}
                  alt="Multiple storefront design styles generated by AI"
                  loading="lazy"
                  width={1280}
                  height={720}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 rounded-[18px] border border-border/70 bg-background/80 px-4 py-3 backdrop-blur-md">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Infinite aesthetics</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Luxury, editorial, cyber, minimal — switch visual direction instantly.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[20px] border border-border/70 bg-card/70 p-4 text-center backdrop-blur-xl"
                >
                  <div className="text-xl font-black tracking-[-0.04em] text-foreground sm:text-2xl">
                    {metric.value}
                  </div>
                  <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 text-center sm:mt-14"
        >
          <Button
            asChild
            className="h-14 rounded-full border border-primary/30 bg-primary px-10 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90"
          >
            <Link to="/ai-builder">
              Try it free
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
