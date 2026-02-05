import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
interface SiteContent {
  hero_media_type: 'image' | 'video';
  hero_image_url: string | null;
  hero_video_url: string | null;
  hero_headline: string;
  hero_subheadline: string;
  hero_rotating_words: string[];
  hero_subtitle: string;
  hero_stats: { assets: string; creators: string; downloads: string };
}

const defaultContent: SiteContent = {
  hero_media_type: 'image',
  hero_image_url: null,
  hero_video_url: null,
  hero_headline: 'Create with',
  hero_subheadline: 'Premium',
  hero_rotating_words: ['Presets', 'LUTs', 'SFX', 'Templates', 'Overlays', 'Fonts', 'Tutorials'],
  hero_subtitle: 'Discover thousands of high-quality digital assets from professional creators.',
  hero_stats: { assets: '5,000+', creators: '500+', downloads: '50k+' }
};

export default function HeroSection() {
  const { user } = useAuth();
  const [activeWord, setActiveWord] = useState(0);
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        if (rect.bottom > 0) {
          setScrollY(window.scrollY);
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('hero_media_type, hero_image_url, hero_video_url, hero_headline, hero_subheadline, hero_rotating_words, hero_subtitle, hero_stats')
        .eq('id', 'main')
        .single();
      
      if (error) {
        console.error('Failed to fetch hero site content:', error);
        return;
      }
      
      if (data) {
        setContent({
          hero_media_type: (data.hero_media_type as 'image' | 'video') || 'image',
          hero_image_url: data.hero_image_url,
          hero_video_url: data.hero_video_url,
          hero_headline: data.hero_headline || defaultContent.hero_headline,
          hero_subheadline: data.hero_subheadline || defaultContent.hero_subheadline,
          hero_rotating_words: data.hero_rotating_words?.length ? data.hero_rotating_words : defaultContent.hero_rotating_words,
          hero_subtitle: data.hero_subtitle || defaultContent.hero_subtitle,
          hero_stats: (data.hero_stats as SiteContent['hero_stats']) || defaultContent.hero_stats
        });
        setVideoFailed(false);
        setVideoLoaded(false);
      }
    };
    fetchContent();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWord(prev => (prev + 1) % content.hero_rotating_words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [content.hero_rotating_words.length]);

  // Use video URL or image URL, with no fallback image (just dark bg)
  const backgroundMedia = content.hero_media_type === 'video' && content.hero_video_url
    ? content.hero_video_url
    : content.hero_image_url;

  // Parallax transforms based on scroll
  const parallaxSlow = scrollY * 0.3;
  const parallaxMedium = scrollY * 0.5;
  const parallaxFast = scrollY * 0.7;

  return (
    <section ref={sectionRef} className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
      {/* Full-width cinematic background with parallax */}
      <div 
        className="absolute inset-0 z-0 flex items-center justify-center"
        style={{ transform: `translateY(${parallaxSlow}px)` }}
      >
        {content.hero_media_type === 'video' && content.hero_video_url && !videoFailed ? (
          <video 
            key={content.hero_video_url}
            src={content.hero_video_url} 
            autoPlay 
            muted 
            loop 
            playsInline
            preload="auto"
            className="min-w-full min-h-full w-auto h-auto object-contain"
            onError={() => {
              console.error('Hero video failed to load:', content.hero_video_url);
              setVideoFailed(true);
            }}
            onLoadedData={() => {
              setVideoLoaded(true);
            }}
          />
        ) : backgroundMedia ? (
          <img 
            src={backgroundMedia} 
            alt="" 
            className="min-w-full min-h-full w-auto h-auto object-contain"
          />
        ) : (
          <div className="w-full h-full bg-background" />
        )}
        {/* Subtle vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30" />
      </div>

      {/* LEFT SIDE - Vertical text */}
      <div 
        className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col items-center gap-6"
        style={{ transform: `translateY(calc(-50% + ${parallaxMedium * 0.3}px))` }}
      >
        <div className="w-px h-20 bg-white/30" />
        <span 
          className="text-xs sm:text-sm font-light tracking-[0.3em] uppercase text-white/70 whitespace-nowrap"
          style={{ 
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)'
          }}
        >
          Digital Assets
        </span>
        <div className="w-px h-12 bg-white/30" />
        <span 
          className="text-xs font-medium tracking-wider text-white/50"
          style={{ 
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)'
          }}
        >
          ★★★★★★★
        </span>
      </div>

      {/* RIGHT SIDE - Vertical text */}
      <div 
        className="absolute right-4 sm:right-8 top-1/3 z-20 hidden md:flex flex-col items-center gap-4"
        style={{ transform: `translateY(${parallaxFast * 0.2}px)` }}
      >
        <div className="border border-white/40 px-3 py-6">
          <span 
            className="text-xs font-bold tracking-[0.2em] uppercase text-white/90"
            style={{ 
              writingMode: 'vertical-rl',
              textOrientation: 'mixed'
            }}
          >
            Creativity defines us.
          </span>
        </div>
      </div>

      {/* CENTER CONTENT */}
      {/* CENTER CONTENT - Now minimal, main text moved to AI Reveal intro */}
      <div className="relative z-10 w-full px-6 sm:px-8 lg:px-16">
        <div className="flex flex-col items-center text-center max-w-7xl mx-auto">
          {/* Pill button - "discover" style */}
          <div 
            className="mt-10 sm:mt-14"
            style={{ transform: `translateY(${parallaxMedium * 0.2}px)` }}
          >
            <Button 
              asChild 
              variant="outline"
              className="h-14 sm:h-16 px-10 sm:px-14 text-base sm:text-lg font-medium tracking-wider rounded-full bg-transparent border-2 border-white/60 text-white hover:bg-white hover:text-black transition-all duration-300"
            >
              <Link to="/products">
                discover
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* BOTTOM LEFT - Decorative elements */}
      <div 
        className="absolute bottom-8 sm:bottom-12 left-6 sm:left-10 z-20 flex items-center gap-4"
        style={{ transform: `translateY(${-parallaxFast * 0.1}px)` }}
      >
        <span className="text-white/50 text-sm font-bold tracking-widest">★★★★★★★</span>
        <span className="text-white/40 text-xs font-light">sellspay.com</span>
      </div>

      {/* BOTTOM RIGHT - Stats/tagline block */}
      <div 
        className="absolute bottom-8 sm:bottom-12 right-6 sm:right-10 z-20 text-right hidden sm:block"
        style={{ transform: `translateY(${-parallaxMedium * 0.15}px)` }}
      >
        <div className="text-white/80 text-sm sm:text-base font-medium leading-relaxed">
          <span className="block">{content.hero_stats.assets}</span>
          <span className="block">Assets</span>
          <span className="block mt-2 text-white/50 text-xs tracking-wider">#endless creativity</span>
        </div>
      </div>

      {/* Scroll indicator - minimal */}
      <div 
        className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        style={{ opacity: Math.max(0, 1 - scrollY / 200) }}
      >
        <div className="w-px h-12 bg-white/30 animate-pulse" />
      </div>
    </section>
  );
}
