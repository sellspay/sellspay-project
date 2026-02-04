import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { ArrowRight, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import heroBg from '@/assets/hero-cinematic.jpg';

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
  hero_subtitle: 'Discover thousands of high-quality digital assets from professional creators. Everything you need to level up your work.',
  hero_stats: { assets: '5,000+', creators: '500+', downloads: '50k+' }
};

export default function HeroSection() {
  const { user } = useAuth();
  const [activeWord, setActiveWord] = useState(0);
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('hero_media_type, hero_image_url, hero_video_url, hero_headline, hero_subheadline, hero_rotating_words, hero_subtitle, hero_stats')
        .eq('id', 'main')
        .single();
      
      if (error) {
        // If RLS or network errors happen, keep defaults (but log for debugging)
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
        if (import.meta.env.DEV) {
          console.log('[Hero] content loaded', {
            hero_media_type: data.hero_media_type,
            hero_video_url: data.hero_video_url,
            hero_image_url: data.hero_image_url,
          });
        }
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

  const backgroundMedia = content.hero_media_type === 'video' && content.hero_video_url
    ? content.hero_video_url
    : content.hero_image_url || heroBg;

  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      {/* MASSIVE Full-width cinematic background */}
      <div className="absolute inset-0 z-0">
        {content.hero_media_type === 'video' && content.hero_video_url && !videoFailed ? (
          <video 
            key={content.hero_video_url}
            src={content.hero_video_url} 
            autoPlay 
            muted 
            loop 
            playsInline
            preload="auto"
            className="w-full h-full object-cover object-center brightness-110 contrast-110 saturate-125"
            onError={() => {
              console.error('Hero video failed to load:', content.hero_video_url);
              setVideoFailed(true);
            }}
            onLoadedData={() => {
              setVideoLoaded(true);
              if (import.meta.env.DEV) console.log('[Hero] video loaded');
            }}
          />
        ) : (
          <img 
            src={backgroundMedia} 
            alt="" 
            className="w-full h-full object-cover object-center"
          />
        )}
        {/* Gradient overlays for text readability */}
        <div
          className={
            content.hero_media_type === 'video'
              ? 'absolute inset-0 bg-gradient-to-t from-background/35 via-background/10 to-transparent'
              : 'absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30'
          }
        />
        <div
          className={
            content.hero_media_type === 'video'
              ? 'absolute inset-0 bg-gradient-to-r from-background/10 via-transparent to-background/10'
              : 'absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/50'
          }
        />
      </div>

      <div className="container mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="text-center flex flex-col items-center max-w-7xl mx-auto pt-20 pb-32">
          {/* MASSIVE headline - Dark charcoal for light video backgrounds */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[140px] font-bold tracking-tighter leading-[0.9] mb-10 sm:mb-12">
            <span className="block font-light italic" style={{ color: 'hsl(var(--hero-text))' }}>
              {content.hero_headline}
            </span>
            <span className="block mt-2 sm:mt-4" style={{ color: 'hsl(var(--hero-text))' }}>
              {content.hero_subheadline}{' '}
              <span 
                key={activeWord} 
                className="inline-block animate-fade-in"
                style={{ color: 'hsl(var(--hero-accent))' }}
              >
                {content.hero_rotating_words[activeWord]}
              </span>
            </span>
          </h1>

          {/* Subtitle - Muted dark for readability */}
          <p className="text-xl sm:text-2xl md:text-3xl max-w-4xl mb-12 sm:mb-16 leading-relaxed font-light" style={{ color: 'hsl(var(--hero-text-muted))' }}>
            {content.hero_subtitle}
          </p>

          {/* CTA Buttons - Vibrant purple primary, dark outline secondary */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 w-full sm:w-auto">
            <Button 
              asChild 
              size="lg" 
              className="h-16 sm:h-18 px-14 sm:px-20 text-lg sm:text-xl font-bold uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 btn-hero-primary"
            >
              <Link to="/products">
                Start Browsing
                <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
            </Button>
            {!user ? (
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="h-16 sm:h-18 px-14 sm:px-20 text-lg sm:text-xl font-bold uppercase tracking-wider transition-all duration-200 btn-hero-outline"
              >
                <Link to="/signup">
                  Create Account
                </Link>
              </Button>
            ) : (
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="h-16 sm:h-18 px-14 sm:px-20 text-lg sm:text-xl font-bold uppercase tracking-wider transition-all duration-200 btn-hero-outline"
              >
                <Link to="/creators">
                  Meet Creators
                </Link>
              </Button>
            )}
          </div>

          {/* Stats row - Dark text for light backgrounds */}
          <div className="flex items-center gap-10 sm:gap-16 mt-20 sm:mt-28">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold" style={{ color: 'hsl(var(--hero-text))' }}>{content.hero_stats.assets}</div>
              <div className="text-base sm:text-lg mt-1" style={{ color: 'hsl(var(--hero-text-muted))' }}>Digital Assets</div>
            </div>
            <div className="w-px h-16" style={{ backgroundColor: 'hsl(var(--hero-text) / 0.2)' }} />
            <div className="text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold" style={{ color: 'hsl(var(--hero-text))' }}>{content.hero_stats.creators}</div>
              <div className="text-base sm:text-lg mt-1" style={{ color: 'hsl(var(--hero-text-muted))' }}>Pro Creators</div>
            </div>
            <div className="w-px h-16" style={{ backgroundColor: 'hsl(var(--hero-text) / 0.2)' }} />
            <div className="text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold" style={{ color: 'hsl(var(--hero-text))' }}>{content.hero_stats.downloads}</div>
              <div className="text-base sm:text-lg mt-1" style={{ color: 'hsl(var(--hero-text-muted))' }}>Downloads</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-bounce" style={{ color: 'hsl(var(--hero-text-muted))' }}>
        <span className="text-sm font-medium">Scroll to explore</span>
        <div className="w-6 h-10 rounded-full border-2 flex items-start justify-center p-1.5" style={{ borderColor: 'hsl(var(--hero-text) / 0.3)' }}>
          <div className="w-1.5 h-3 rounded-full animate-pulse" style={{ backgroundColor: 'hsl(var(--hero-text) / 0.4)' }} />
        </div>
      </div>
    </section>
  );
}
