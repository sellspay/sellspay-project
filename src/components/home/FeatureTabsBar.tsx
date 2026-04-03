import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Reveal } from './Reveal';
import { Plus, Minus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import everythingYouNeedImg from '@/assets/everything-you-need.jpg';
import toolImageImg from '@/assets/tool-image-gen.jpg';
import toolStemImg from '@/assets/tool-stem-splitter.jpg';
import toolVocalImg from '@/assets/tool-vocal-isolator.jpg';
import toolSfxImg from '@/assets/tool-sfx-gen.jpg';

const categories = [
  {
    id: 'marketplace',
    number: '01',
    label: 'Marketplace',
    featured: {
      title: 'Browse & Sell Digital Assets',
      desc: 'Discover thousands of premium digital products from top creators worldwide. From LUTs to presets, sound effects to templates — find everything you need.',
      link: '/products',
      linkText: 'Explore Marketplace',
      image: everythingYouNeedImg,
    },
    tools: ['LUTs & Presets', 'Sound Packs', 'Templates & Themes'],
  },
  {
    id: 'image',
    number: '02',
    label: 'Image Generation',
    featured: {
      title: 'AI Image Generator',
      desc: 'Turn text prompts into stunning visuals. Create product mockups, thumbnails, banners, and art in seconds — no design skills needed.',
      link: '/tools',
      linkText: 'Try Image Generator',
      image: toolImageImg,
    },
    tools: ['Background Remover', 'Image Enhancer', 'Photo Editor'],
  },
  {
    id: 'video',
    number: '03',
    label: 'Video Generation',
    featured: {
      title: 'AI Video Generator',
      desc: 'Generate stunning videos from text prompts or images. Create product demos, social content, and promo reels — no filming required.',
      link: '/tools',
      linkText: 'Try Video Generator',
      image: toolStemImg,
    },
    tools: ['Text-to-Video', 'Image-to-Video', 'Promo Video Builder'],
  },
  {
    id: 'audio',
    number: '04',
    label: 'Audio Tools',
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
    id: 'storefront',
    number: '05',
    label: 'AI Storefront',
    featured: {
      title: 'VibeCoder',
      desc: 'Describe your storefront idea and watch AI build it live — layouts, styles, and content. No coding needed, fully customizable.',
      link: '/ai-builder',
      linkText: 'Try VibeCoder',
      image: toolSfxImg,
    },
    tools: ['Storefront Builder', 'Landing Pages', 'Brand Kit'],
  },
];

export function FeatureTabsBar() {
  const [openId, setOpenId] = useState<string>('marketplace');

  const toggle = (id: string) => {
    setOpenId(id);
  };

  return (
    <Reveal>
      <section className="px-6 sm:px-8 lg:px-10 pt-20 sm:pt-28 pb-16 sm:pb-20 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight"
          >
            Everything you need
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            className="text-base sm:text-lg text-muted-foreground mt-3 max-w-md mx-auto leading-relaxed"
          >
            One platform for selling, creating, and growing your digital brand.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-5"
          >
            <Link
              to="/login"
              className="inline-flex h-10 px-6 items-center justify-center rounded-full bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
            >
              Try online
            </Link>
          </motion.div>
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
                  className="w-full flex items-center gap-4 sm:gap-8 py-4 sm:py-5 group text-left"
                >
                  <span className="text-lg sm:text-xl lg:text-2xl font-light text-muted-foreground/40 tabular-nums w-10 sm:w-12 shrink-0">
                    {cat.number}
                  </span>
                  <span className="text-base sm:text-lg lg:text-xl font-semibold text-foreground flex-1 group-hover:text-primary transition-colors">
                    {cat.label}
                  </span>
                  <div className="p-1">
                    {isOpen ? (
                      <Minus className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    ) : (
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
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

      </section>
    </Reveal>
  );
}
