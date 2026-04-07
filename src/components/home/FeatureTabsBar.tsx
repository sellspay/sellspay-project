import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Reveal } from './Reveal';
import { ArrowRight, Sparkles } from 'lucide-react';
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
  label: string;
  tagline: string;
  subTools: SubTool[];
}

const categories: Category[] = [
  {
    id: 'marketplace',
    label: 'Marketplace',
    tagline: 'Premium digital assets from top creators',
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
        desc: 'Royalty-free sound effects, ambient packs, and audio loops for video editors, podcasters, and music producers.',
        link: '/products',
        linkText: 'Browse Sound Packs',
        image: toolVocalImg,
      },
      {
        name: 'Templates & Themes',
        desc: 'Ready-made design templates for social media, storefronts, and portfolios. Skip the blank canvas.',
        link: '/products',
        linkText: 'Browse Templates',
        image: toolSfxImg,
      },
    ],
  },
  {
    id: 'image',
    label: 'Image Generation',
    tagline: 'Create stunning visuals with AI',
    subTools: [
      {
        name: 'AI Image Generator',
        desc: 'Turn text prompts into stunning visuals. Create product mockups, thumbnails, banners, and art in seconds.',
        link: '/tools',
        linkText: 'Try Image Generator',
        image: toolImageImg,
      },
      {
        name: 'Background Remover',
        desc: 'Remove backgrounds from any image with one click. Perfect for product photos and transparent overlays.',
        link: '/tools',
        linkText: 'Try Background Remover',
        image: toolImageImg,
      },
      {
        name: 'Image Enhancer',
        desc: 'Upscale and enhance image quality with AI. Fix low-res images and sharpen every detail.',
        link: '/tools',
        linkText: 'Try Image Enhancer',
        image: toolImageImg,
      },
    ],
  },
  {
    id: 'video',
    label: 'Video Generation',
    tagline: 'Cinematic video creation powered by AI',
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
        desc: 'Animate any still image into a dynamic video. Add camera movement, character motion, and effects.',
        link: '/tools',
        linkText: 'Try Image-to-Video',
        image: toolStemImg,
      },
      {
        name: 'Motion Transfer',
        desc: 'Transfer motion from one video to another. Sync dance moves, actions, and expressions across subjects.',
        link: '/tools/motion-transfer',
        linkText: 'Try Motion Transfer',
        image: toolStemImg,
      },
    ],
  },
  {
    id: 'audio',
    label: 'Audio Tools',
    tagline: 'Studio-grade audio processing',
    subTools: [
      {
        name: 'Vocal Isolator',
        desc: 'Extract clean vocals from any track instantly with AI-powered source separation.',
        link: '/studio/voice-isolator',
        linkText: 'Try Vocal Isolator',
        image: toolVocalImg,
      },
      {
        name: 'Stem Splitter',
        desc: 'Separate any song into individual stems — vocals, drums, bass, and instruments.',
        link: '/studio/voice-isolator',
        linkText: 'Try Stem Splitter',
        image: toolVocalImg,
      },
      {
        name: 'AI SFX Generator',
        desc: 'Generate custom sound effects from text descriptions. Create any sound you can imagine.',
        link: '/tools',
        linkText: 'Try SFX Generator',
        image: toolSfxImg,
      },
    ],
  },
  {
    id: 'storefront',
    label: 'AI Storefront',
    tagline: 'Build your brand with AI',
    subTools: [
      {
        name: 'VibeCoder',
        desc: 'Describe your storefront idea and watch AI build it live — layouts, styles, and content.',
        link: '/ai-builder',
        linkText: 'Try VibeCoder',
        image: toolSfxImg,
      },
      {
        name: 'Brand Kit',
        desc: 'Define your colors, fonts, and visual identity in one place. Stay perfectly on-brand.',
        link: '/ai-builder',
        linkText: 'Set Up Brand Kit',
        image: toolSfxImg,
      },
      {
        name: 'Landing Pages',
        desc: 'Generate high-converting landing pages for product launches and promotions.',
        link: '/ai-builder',
        linkText: 'Build Landing Page',
        image: toolSfxImg,
      },
    ],
  },
];

export function FeatureTabsBar() {
  const [activeId, setActiveId] = useState('marketplace');
  const [activeSubIndex, setActiveSubIndex] = useState<Record<string, number>>({});

  const activeCat = categories.find((c) => c.id === activeId) || categories[0];
  const subIdx = activeSubIndex[activeId] ?? 0;
  const activeSub = activeCat.subTools[subIdx];

  return (
    <section className="py-24 sm:py-32 lg:py-40" style={{ background: '#000' }}>
      <div className="px-6 sm:px-8 lg:px-12 max-w-[1200px] mx-auto">
        {/* Header */}
        <Reveal>
          <div className="text-center mb-16 sm:mb-20">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-5">
              Platform
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.05]">
              Everything you need
            </h2>
            <p className="text-base sm:text-lg text-white/50 mt-4 max-w-lg mx-auto leading-relaxed">
              One platform for selling, creating, and growing your digital brand.
            </p>
          </div>
        </Reveal>

        {/* Category tabs — horizontal pill bar */}
        <Reveal>
          <div className="flex flex-wrap justify-center gap-2 mb-12 sm:mb-16">
            {categories.map((cat) => {
              const isActive = activeId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveId(cat.id)}
                  className={`relative px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'btn-premium text-white shadow-lg shadow-primary/25'
                      : 'btn-premium text-white/70 hover:text-white opacity-60 hover:opacity-90'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Content area — two column layout */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="rounded-3xl border border-white/[0.08] overflow-hidden" style={{ background: '#0a0a0a' }}>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr]">
                {/* Left — sub tools list */}
                <div className="p-6 sm:p-8 lg:p-10 flex flex-col">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70 mb-1">
                    {activeCat.label}
                  </p>
                  <p className="text-sm text-white/40 mb-8">
                    {activeCat.tagline}
                  </p>

                  <div className="flex flex-col gap-1 flex-1">
                    {activeCat.subTools.map((sub, idx) => {
                      const isActive = idx === subIdx;
                      return (
                        <button
                          key={sub.name}
                          onClick={() => setActiveSubIndex((prev) => ({ ...prev, [activeId]: idx }))}
                          className={`group w-full text-left px-5 py-4 rounded-2xl transition-all duration-300 cursor-pointer ${
                            isActive
                              ? 'border border-white/[0.1] shadow-lg shadow-primary/[0.05]'
                              : 'hover:bg-white/[0.03] border border-transparent'
                          }`}
                          style={isActive ? {
                            background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(14,14,14,0.95) 50%, rgba(22,22,26,0.9) 100%)',
                          } : undefined}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isActive ? 'bg-primary shadow-[0_0_8px_rgba(37,99,235,0.6)]' : 'bg-white/20'}`} />
                            <span className={`text-[15px] font-semibold transition-colors duration-200 ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/70'}`}>
                              {sub.name}
                            </span>
                          </div>
                          
                          <AnimatePresence initial={false}>
                            {isActive && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden"
                              >
                                <p className="text-[13px] text-white/40 leading-relaxed mt-2.5 ml-[18px] max-w-sm">
                                  {sub.desc}
                                </p>
                                <Link
                                  to={sub.link}
                                  className="inline-flex items-center gap-1.5 mt-3 ml-[18px] text-xs font-semibold text-primary hover:text-primary/80 transition-colors group/link"
                                >
                                  {sub.linkText}
                                  <ArrowRight className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5" />
                                </Link>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/[0.06]">
                    <Link
                      to="/login"
                      className="inline-flex h-10 px-6 items-center justify-center rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                    >
                      Get Started Free
                      <ArrowRight className="h-3.5 w-3.5 ml-2" />
                    </Link>
                  </div>
                </div>

                {/* Right — preview image */}
                <div className="relative hidden lg:block">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${activeId}-${subIdx}`}
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="absolute inset-0"
                    >
                      <img
                        src={activeSub.image}
                        alt={activeSub.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Gradient overlay from left for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent w-1/3" />
                      {/* Bottom gradient */}
                      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                      
                      {/* Floating label */}
                      <div className="absolute bottom-6 left-6 right-6">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                            {activeSub.name}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
