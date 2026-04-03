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
  const [openId, setOpenId] = useState<string | null>('marketplace');

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
              Everything you need
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mt-2 max-w-md leading-relaxed">
              One platform for selling, creating, and growing your digital brand.
            </p>
          </div>
          <Link
            to="/tools"
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
                      <div className="rounded-2xl bg-secondary/50 border border-border/20 p-6 sm:p-8 lg:p-10 mb-6 sm:mb-8">
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 lg:gap-12">
                          {/* Left: Content */}
                          <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles className="h-4 w-4 text-primary" />
                              <span className="text-sm font-semibold text-foreground">
                                {cat.featured.title}
                              </span>
                            </div>
                            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mb-6">
                              <Link
                                to={cat.featured.link}
                                className="text-primary hover:underline"
                              >
                                {cat.featured.linkText}
                              </Link>
                              {' — '}
                              {cat.featured.desc}
                            </p>

                            {/* Other tools list */}
                            <div className="space-y-3">
                              {cat.tools.map((tool) => (
                                <p key={tool} className="text-sm sm:text-base font-semibold text-foreground">
                                  {tool}
                                </p>
                              ))}
                            </div>
                          </div>

                          {/* Right: Image */}
                          <div className="w-full lg:w-[340px] xl:w-[400px] shrink-0">
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
