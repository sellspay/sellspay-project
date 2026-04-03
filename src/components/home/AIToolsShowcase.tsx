import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Reveal } from './Reveal';
import { Plus, Minus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toolVocalImg from '@/assets/tool-vocal-isolator.jpg';
import toolStemImg from '@/assets/tool-stem-splitter.jpg';
import toolImageImg from '@/assets/tool-image-gen.jpg';
import toolSfxImg from '@/assets/tool-sfx-gen.jpg';

const categories = [
  {
    id: 'audio',
    number: '01',
    label: 'Audio',
    featured: {
      title: 'Vocal Isolator',
      desc: 'Extract clean vocals from any track instantly with AI-powered source separation. Perfect for remixes, karaoke, and content creation.',
      link: '/studio/voice-isolator',
      linkText: 'Try Vocal Isolator',
      image: toolVocalImg,
    },
    tools: ['Stem Splitter', 'AI SFX Generator', 'Audio Converter'],
  },
  {
    id: 'video',
    number: '02',
    label: 'Video',
    featured: {
      title: 'AI Video Generator',
      desc: 'Generate stunning videos from text prompts. Create product demos, social content, and promo reels — no filming required.',
      link: '/studio',
      linkText: 'Try Video Generator',
      image: toolStemImg,
    },
    tools: ['Video to Audio', 'Promo Video Builder', 'Waveform Generator'],
  },
  {
    id: 'image',
    number: '03',
    label: 'Image',
    featured: {
      title: 'AI Image Generator',
      desc: 'Turn text prompts into stunning visuals. Create product mockups, thumbnails, banners, and art in seconds.',
      link: '/studio',
      linkText: 'Try Image Generator',
      image: toolImageImg,
    },
    tools: ['Background Remover', 'Image Enhancer', 'Photo Editor'],
  },
  {
    id: 'code',
    number: '04',
    label: 'Creative Templates',
    featured: {
      title: 'VibeCoder',
      desc: 'Describe your storefront idea and watch AI build it live — layouts, styles, and content. No coding needed.',
      link: '/ai-builder',
      linkText: 'Try VibeCoder',
      image: toolSfxImg,
    },
    tools: ['Storefront Builder', 'Landing Pages', 'Portfolio Templates'],
  },
];

export function AIToolsShowcase() {
  const [openId, setOpenId] = useState<string | null>('audio');

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <Reveal>
      <section className="px-6 sm:px-8 lg:px-10 pb-16 sm:pb-20">
        {/* Header */}
        <div className="flex items-start justify-between mb-10 sm:mb-14">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-foreground tracking-tight">
              AI Editing Tools
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mt-2 max-w-md leading-relaxed">
              The reliable and essential AI editing features for audio, video, image, and code.
            </p>
          </div>
          <Link
            to="/studio"
            className="hidden sm:inline-flex h-10 px-6 items-center justify-center rounded-full bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors shrink-0"
          >
            Try online
          </Link>
        </div>

        {/* Accordion rows */}
        <div className="space-y-0">
          {categories.map((cat) => {
            const isOpen = openId === cat.id;
            return (
              <div key={cat.id} className="border-b border-border/40">
                {/* Row header */}
                <button
                  onClick={() => toggle(cat.id)}
                  className="w-full flex items-center gap-6 sm:gap-10 py-6 sm:py-8 group text-left"
                >
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-light text-muted-foreground/40 tabular-nums w-12 sm:w-16 shrink-0">
                    {cat.number}
                  </span>
                  <span className="text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground flex-1 group-hover:text-primary transition-colors">
                    {cat.label}
                  </span>
                  <div className="p-1">
                    {isOpen ? (
                      <Minus className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                    ) : (
                      <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expandable panel */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl bg-secondary/30 border border-border/10 p-5 sm:p-6 lg:p-8 mb-4 sm:mb-6 max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6 lg:gap-8 items-center">
                          {/* Left: Content */}
                          <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-3.5 w-3.5 text-primary" />
                              <span className="text-sm font-semibold text-foreground">
                                {cat.featured.title}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-5">
                              <Link
                                to={cat.featured.link}
                                className="text-primary hover:underline"
                              >
                                {cat.featured.linkText}
                              </Link>
                              {' — '}
                              {cat.featured.desc}
                            </p>

                            <div className="space-y-2">
                              {cat.tools.map((tool) => (
                                <p key={tool} className="text-sm font-semibold text-foreground">
                                  {tool}
                                </p>
                              ))}
                            </div>
                          </div>

                          {/* Right: Image */}
                          <div className="w-full shrink-0">
                            <img
                              src={cat.featured.image}
                              alt={cat.featured.title}
                              className="w-full h-auto rounded-xl object-cover aspect-[4/3]"
                              loading="lazy"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA pill */}
        <div className="flex justify-center mt-10 sm:mt-14">
          <Link
            to="/studio"
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-border/30 hover:border-primary/30 transition-all"
          >
            <span className="text-sm font-medium text-foreground">
              Create smarter, build faster
            </span>
            <span className="inline-flex h-9 px-5 items-center justify-center rounded-full bg-foreground text-background text-sm font-semibold">
              Try online for free
            </span>
          </Link>
        </div>
      </section>
    </Reveal>
  );
}
