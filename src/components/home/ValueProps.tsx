import { Reveal } from './Reveal';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export function ValueProps() {
  return (
    <section className="relative py-32 sm:py-40 lg:py-52 overflow-hidden">
      {/* Gradient background that fades in */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute inset-0"
        style={{
          background: 'hsl(220 15% 7%)',
        }}
      />

      {/* Subtle abstract shapes */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 0.15, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="absolute top-1/4 -left-40 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(217 60% 30%) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 0.1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, delay: 0.5 }}
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(30 60% 30%) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative z-10 px-6 sm:px-8 lg:px-12 max-w-[1100px] mx-auto">
        {/* Label */}
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-6">
            The Platform
          </p>
        </Reveal>

        {/* Giant heading */}
        <Reveal>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extralight text-foreground tracking-tight leading-[1.05] mb-16 sm:mb-20">
            Thousands of creators{' '}
            <br className="hidden sm:block" />
            choose{' '}
            <span className="font-bold text-primary">SellsPay</span>
          </h2>
        </Reveal>

        {/* Two-column content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left — subtitle */}
          <Reveal>
            <p className="text-xl sm:text-2xl lg:text-3xl font-light text-foreground/70 leading-relaxed">
              Stop jumping between platforms. Your storefront, tools, and payments —{' '}
              <span className="text-primary font-medium">unified.</span>
            </p>
          </Reveal>

          {/* Right — details */}
          <Reveal delay={100}>
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 tracking-tight">
                Start Selling
              </h3>
              <div className="w-12 h-px bg-foreground/20 mb-6" />
              <p className="text-base sm:text-lg text-foreground/60 leading-relaxed mb-4">
                We built SellsPay for creators who are tired of stitching together five different services just to sell a preset pack.
              </p>
              <p className="text-base sm:text-lg text-foreground/60 leading-relaxed">
                Sell. Create with AI tools. Get paid instantly. No more going site to site.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
