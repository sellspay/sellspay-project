import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Wand2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import showcaseCode from '@/assets/showcase-code-preview-v2.jpg';
import showcaseVibes from '@/assets/showcase-aesthetics-v2.jpg';

const stats = [
  { value: '10s', label: 'avg. build time' },
  { value: '∞', label: 'design styles' },
  { value: '0', label: 'code required' },
];

export function AIBuilderShowcase() {
  return (
    <section className="studio-dark relative overflow-hidden bg-background py-28 sm:py-36 lg:py-44">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-28 h-[380px] w-[380px] -translate-x-1/2 rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.24) 0%, transparent 70%)' }}
        />
        <div
          className="absolute left-1/2 top-44 h-[560px] w-[980px] -translate-x-1/2 rounded-full blur-[180px]"
          style={{ background: 'radial-gradient(circle, hsl(var(--ring) / 0.12) 0%, transparent 72%)' }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-Powered Storefront Builder
          </div>

          <h2 className="mt-6 text-[clamp(3.3rem,8vw,7rem)] font-black leading-[0.9] tracking-[-0.07em] text-foreground">
            AI Builder
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            Describe your brand, style, and experience — then watch the live preview and production-ready code come together in one centered build flow.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="mx-auto mt-14 max-w-[980px]"
        >
          <div
            className="overflow-hidden rounded-[32px] border border-border/70 bg-card/75 backdrop-blur-xl"
            style={{ boxShadow: '0 40px 120px -56px hsl(var(--primary) / 0.45)' }}
          >
            <div className="relative aspect-[16/10] overflow-hidden sm:aspect-[16/9]">
              <img
                src={showcaseCode}
                alt="Live code editor with real-time storefront preview"
                loading="lazy"
                width={1280}
                height={720}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/15 to-background/10" />

              <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Live Build + Preview
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                <div className="rounded-[24px] border border-border/70 bg-background/78 p-5 backdrop-blur-xl sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="max-w-xl text-left">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                        Prompt to storefront
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
                        Build from one prompt — centered around the result.
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        The main stage stays anchored in the middle, so the whole section feels balanced even on huge screens.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <span className="rounded-full border border-border/70 bg-card px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        real code
                      </span>
                      <span className="rounded-full border border-border/70 bg-card px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        instant preview
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mx-auto mt-5 grid max-w-[980px] gap-4 md:grid-cols-[0.92fr_1.08fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="rounded-[28px] border border-border/70 bg-card/70 p-5 backdrop-blur-xl sm:p-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                <Wand2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Prompt input</p>
                <p className="text-xs text-muted-foreground">Natural language → full experience</p>
              </div>
            </div>

            <div className="mt-5 rounded-[22px] border border-border/70 bg-background/80 p-4">
              <p className="text-sm leading-6 text-muted-foreground">
                <span className="font-medium text-foreground">Build me</span> a luxury storefront with cinematic hero media, premium typography, and elegant product cards.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: '0%' }}
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 2.2, delay: 0.35, ease: 'easeInOut' }}
                />
              </div>
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Generating</span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[18px] border border-border/70 bg-background/70 p-3 text-center"
                >
                  <div className="text-lg font-black tracking-[-0.04em] text-foreground sm:text-xl">{stat.value}</div>
                  <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="overflow-hidden rounded-[28px] border border-border/70 bg-card/70 backdrop-blur-xl"
          >
            <div className="relative aspect-[16/12] overflow-hidden">
              <img
                src={showcaseVibes}
                alt="Multiple storefront design styles generated by AI"
                loading="lazy"
                width={1280}
                height={720}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

              <div className="absolute bottom-4 left-4 right-4 rounded-[22px] border border-border/70 bg-background/80 p-4 backdrop-blur-md sm:bottom-5 sm:left-5 sm:right-5">
                <div className="flex items-center gap-2 text-primary">
                  <Zap className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Infinite aesthetics</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Luxury, editorial, cyber, minimal — switch directions instantly without losing the centered composition.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mt-12 text-center"
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
