import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Reveal } from './Reveal';
import { Plus, Minus, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import everythingYouNeedImg from '@/assets/everything-you-need.jpg';
import toolImageImg from '@/assets/tool-image-gen.jpg';
import toolStemImg from '@/assets/tool-stem-splitter.jpg';
import toolVocalImg from '@/assets/tool-vocal-isolator.jpg';
import toolSfxImg from '@/assets/tool-sfx-gen.jpg';

interface SubTool {
  name: string;
  desc: string;
  link: string;
  linkText: string;
  image: string;
}

interface Category {
  id: string;
  number: string;
  label: string;
  subTools: SubTool[];
}

const categories: Category[] = [
  {
    id: 'marketplace',
    number: '01',
    label: 'Marketplace',
    subTools: [
      {
        name: 'LUTs & Presets',
        desc: 'Professional color grading LUTs and editing presets crafted by top creators. Instantly transform your photos and videos with cinema-quality looks.',
        link: '/products',
        linkText: 'Browse LUTs & Presets',
        image: everythingYouNeedImg,
      },
      {
        name: 'Sound Packs',
        desc: 'Royalty-free sound effects, ambient packs, and audio loops for video editors, podcasters, and music producers. Studio-quality audio, instantly downloadable.',
        link: '/products',
        linkText: 'Browse Sound Packs',
        image: toolVocalImg,
      },
      {
        name: 'Templates & Themes',
        desc: 'Ready-made design templates for social media, storefronts, and portfolios. Skip the blank canvas and start with a polished foundation.',
        link: '/products',
        linkText: 'Browse Templates',
        image: toolSfxImg,
      },
    ],
  },
  {
    id: 'image',
    number: '02',
    label: 'Image Generation',
    subTools: [
      {
        name: 'AI Image Generator',
        desc: 'Turn text prompts into stunning visuals. Create product mockups, thumbnails, banners, and art in seconds — no design skills needed.',
        link: '/tools',
        linkText: 'Try Image Generator',
        image: toolImageImg,
      },
      {
        name: 'Background Remover',
        desc: 'Remove backgrounds from any image with one click. Perfect for product photos, profile pictures, and transparent overlays.',
        link: '/tools',
        linkText: 'Try Background Remover',
        image: toolImageImg,
      },
      {
        name: 'Image Enhancer',
        desc: 'Upscale and enhance image quality with AI. Fix low-res images, sharpen details, and make every pixel count.',
        link: '/tools',
        linkText: 'Try Image Enhancer',
        image: toolImageImg,
      },
    ],
  },
  {
    id: 'video',
    number: '03',
    label: 'Video Generation',
    subTools: [
      {
        name: 'Text-to-Video',
        desc: 'Generate stunning videos from text prompts. Describe a scene and watch AI bring it to life with cinematic quality.',
        link: '/tools',
        linkText: 'Try Text-to-Video',
        image: toolStemImg,
      },
      {
        name: 'Image-to-Video',
        desc: 'Animate any still image into a dynamic video. Add camera movement, character motion, and environmental effects.',
        link: '/tools',
        linkText: 'Try Image-to-Video',
        image: toolStemImg,
      },
      {
        name: 'Motion Transfer',
        desc: 'Transfer motion from one video to another. Sync dance moves, actions, and expressions across different subjects.',
        link: '/tools/motion-transfer',
        linkText: 'Try Motion Transfer',
        image: toolStemImg,
      },
    ],
  },
  {
    id: 'audio',
    number: '04',
    label: 'Audio Tools',
    subTools: [
      {
        name: 'Vocal Isolator',
        desc: 'Extract clean vocals from any track instantly with AI-powered source separation. Perfect for remixes, karaoke, and content creation.',
        link: '/studio/voice-isolator',
        linkText: 'Try Vocal Isolator',
        image: toolVocalImg,
      },
      {
        name: 'Stem Splitter',
        desc: 'Separate any song into individual stems — vocals, drums, bass, and instruments. Full creative control over every layer.',
        link: '/studio/voice-isolator',
        linkText: 'Try Stem Splitter',
        image: toolVocalImg,
      },
      {
        name: 'AI SFX Generator',
        desc: 'Generate custom sound effects from text descriptions. Footsteps, explosions, ambience — create any sound you can imagine.',
        link: '/tools',
        linkText: 'Try SFX Generator',
        image: toolSfxImg,
      },
    ],
  },
  {
    id: 'storefront',
    number: '05',
    label: 'AI Storefront',
    subTools: [
      {
        name: 'VibeCoder',
        desc: 'Describe your storefront idea and watch AI build it live — layouts, styles, and content. No coding needed, fully customizable.',
        link: '/ai-builder',
        linkText: 'Try VibeCoder',
        image: toolSfxImg,
      },
      {
        name: 'Brand Kit',
        desc: 'Define your colors, fonts, and visual identity in one place. Every page and product you create stays perfectly on-brand.',
        link: '/ai-builder',
        linkText: 'Set Up Brand Kit',
        image: toolSfxImg,
      },
      {
        name: 'Landing Pages',
        desc: 'Generate high-converting landing pages for product launches, promotions, and lead capture — all AI-powered.',
        link: '/ai-builder',
        linkText: 'Build Landing Page',
        image: toolSfxImg,
      },
    ],
  },
];

export function FeatureTabsBar() {
  const [openId, setOpenId] = useState<string>('marketplace');
  const [activeSubIndex, setActiveSubIndex] = useState<Record<string, number>>({});

  const toggle = (id: string) => {
    setOpenId(id);
  };

  const getSubIndex = (catId: string) => activeSubIndex[catId] ?? 0;

  const setSubIndex = (catId: string, idx: number) => {
    setActiveSubIndex((prev) => ({ ...prev, [catId]: idx }));
  };

  return (
    <Reveal>
      <section className="px-6 sm:px-8 lg:px-10 pt-20 sm:pt-28 pb-16 sm:pb-20 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14 sm:mb-20">
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
            className="mt-6"
          >
            <Link
              to="/login"
              className="inline-flex h-11 px-7 items-center justify-center rounded-full bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
            >
              Try online
            </Link>
          </motion.div>
        </div>

        {/* Accordion rows */}
        <div>
          {categories.map((cat, catIdx) => {
            const isOpen = openId === cat.id;
            const subIdx = getSubIndex(cat.id);
            const activeSub = cat.subTools[subIdx];

            return (
              <div
                key={cat.id}
                className={`border-b border-primary/20 ${catIdx === 0 ? 'border-t' : ''}`}
              >
                {/* Row header */}
                <button
                  onClick={() => toggle(cat.id)}
                  className="w-full flex items-center gap-4 sm:gap-8 py-5 sm:py-6 group text-left cursor-pointer"
                >
                  <span className="text-lg sm:text-xl lg:text-2xl font-light text-muted-foreground/50 tabular-nums w-10 sm:w-12 shrink-0 transition-colors group-hover:text-primary/60">
                    {cat.number}
                  </span>
                  <span
                    className={`text-base sm:text-lg lg:text-xl font-semibold flex-1 transition-colors duration-300 ${
                      isOpen ? 'text-primary' : 'text-foreground group-hover:text-primary'
                    }`}
                  >
                    {cat.label}
                  </span>
                  <div className="p-1">
                    {isOpen ? (
                      <Minus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    ) : (
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary transition-colors" />
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
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl bg-card border border-primary/15 shadow-sm p-5 sm:p-6 lg:p-8 mb-5 sm:mb-7">
                        {/* Sub-tool list with inline expansion */}
                        <div className="flex flex-col">
                          {cat.subTools.map((sub, idx) => {
                            const isActive = idx === subIdx;
                            return (
                              <div key={sub.name}>
                                <button
                                  onClick={() => setSubIndex(cat.id, idx)}
                                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                                    isActive
                                      ? 'text-primary bg-primary/8'
                                      : 'text-foreground/80 hover:text-primary hover:bg-primary/5'
                                  }`}
                                >
                                  {sub.name}
                                </button>

                                {/* Expanded content appears directly below the active item */}
                                <AnimatePresence initial={false}>
                                  {isActive && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                      className="overflow-hidden"
                                    >
                                      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 lg:gap-10 items-start px-3 pt-4 pb-5">
                                        <div>
                                          <div className="flex items-center gap-2.5 mb-3">
                                            <Sparkles className="h-4 w-4 text-primary" />
                                            <span className="text-base font-bold text-foreground">
                                              {sub.name}
                                            </span>
                                          </div>
                                          <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed max-w-md mb-4">
                                            {sub.desc}
                                          </p>
                                          <Link
                                            to={sub.link}
                                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-4 group/link"
                                          >
                                            {sub.linkText}
                                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
                                          </Link>
                                        </div>
                                        <div className="w-full shrink-0">
                                          <img
                                            src={sub.image}
                                            alt={sub.name}
                                            className="w-full h-auto rounded-xl object-cover aspect-[4/3] shadow-md"
                                            loading="lazy"
                                          />
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
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
