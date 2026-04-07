import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import showcaseCode from '@/assets/showcase-code-preview-v2.jpg';
import showcaseVibes from '@/assets/showcase-aesthetics-v2.jpg';

export function AIBuilderShowcase() {
  return (
    <section className="relative py-32 sm:py-40 lg:py-48 overflow-hidden">
      {/* Background glow behind the title */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] rounded-full bg-white/[0.04] blur-[180px]" />
      </div>

      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top label */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-sm sm:text-base text-white/50 tracking-wide mb-6"
        >
          AI-Powered Storefront Builder
        </motion.p>

        {/* Giant glowing title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative text-center mb-16 sm:mb-20"
        >
          <h2
            className="text-[clamp(3.5rem,10vw,10rem)] font-black tracking-tight leading-[0.9] text-transparent"
            style={{
              WebkitTextStroke: '1.5px rgba(255,255,255,0.15)',
              textShadow: '0 0 80px rgba(255,255,255,0.08), 0 0 160px rgba(255,255,255,0.04)',
            }}
          >
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.2) 100%)',
              }}
            >
              AI Builder
            </span>
          </h2>

          {/* Subtle glow orb behind text */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] rounded-full bg-white/[0.03] blur-[100px] pointer-events-none" />
        </motion.div>

        {/* Floating UI elements around the title area */}
        <div className="relative">
          {/* Bento grid of showcase elements */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            
            {/* Left: Prompt mockup card */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5"
            >
              <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-5 sm:p-6">
                {/* Mock toolbar */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                    AI
                  </div>
                  <div className="flex gap-2">
                    <div className="px-3 py-1.5 rounded-full bg-white/10 text-[11px] font-medium text-white/80 border border-white/[0.08]">
                      Storefront
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-white/[0.04] text-[11px] font-medium text-white/40 border border-white/[0.05]">
                      Landing Page
                    </div>
                  </div>
                </div>

                {/* Prompt input mockup */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 mb-4">
                  <p className="text-sm text-white/60 leading-relaxed">
                    <span className="text-white/90 font-medium">Build me</span> a luxury fashion boutique with dark theme, 
                    gold accents, hero video section, and a product grid with hover effects...
                  </p>
                </div>

                {/* Generation status */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
                      initial={{ width: '0%' }}
                      whileInView={{ width: '100%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 2.5, delay: 0.8, ease: 'easeInOut' }}
                    />
                  </div>
                  <span className="text-[11px] text-white/40 font-medium">Generating...</span>
                </div>
              </div>

              {/* Code preview card below */}
              <div className="mt-4 rounded-[20px] border border-white/[0.08] overflow-hidden">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={showcaseCode}
                    alt="Live code editor with real-time storefront preview"
                    loading="lazy"
                    width={1280}
                    height={720}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-[10px] font-bold tracking-widest uppercase text-cyan-400">Live Code + Preview</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Center: CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="lg:col-span-2 flex flex-col items-center justify-center py-8 lg:py-0"
            >
              <Button
                asChild
                className="h-14 px-8 text-sm font-bold tracking-wider rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-400 hover:to-cyan-400 shadow-lg shadow-blue-500/25 transition-all duration-300 group"
              >
                <Link to="/ai-builder">
                  Try it free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <p className="mt-4 text-[11px] text-white/30 text-center">No code required</p>
            </motion.div>

            {/* Right: Aesthetics showcase */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="lg:col-span-5"
            >
              {/* Generated sites collage */}
              <div className="rounded-[20px] border border-white/[0.08] overflow-hidden">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={showcaseVibes}
                    alt="Multiple storefront design styles generated by AI"
                    loading="lazy"
                    width={1280}
                    height={720}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                    <span className="text-[10px] font-bold tracking-widest uppercase text-fuchsia-400">Infinite Aesthetics</span>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { value: '10s', label: 'Avg. build time' },
                  { value: '∞', label: 'Design styles' },
                  { value: '0', label: 'Code required' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-4 text-center"
                  >
                    <div className="text-xl sm:text-2xl font-black text-white/90 mb-1">{stat.value}</div>
                    <div className="text-[10px] text-white/40 font-medium tracking-wide uppercase">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
