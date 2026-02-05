import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Reveal } from './Reveal';

interface SiteContent {
  hero_headline: string;
  hero_subheadline: string;
  hero_rotating_words: string[];
}

const defaultContent: SiteContent = {
  hero_headline: 'Create with',
  hero_subheadline: 'Premium',
  hero_rotating_words: ['Presets', 'LUTs', 'SFX', 'Templates', 'Overlays', 'Fonts', 'Tutorials'],
};

export function HeroTextIntro() {
  const [activeWord, setActiveWord] = useState(0);
  const [content, setContent] = useState<SiteContent>(defaultContent);

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('hero_headline, hero_subheadline, hero_rotating_words')
        .eq('id', 'main')
        .single();

      if (error) {
        console.error('Failed to fetch hero text content:', error);
        return;
      }

      if (data) {
        setContent({
          hero_headline: data.hero_headline || defaultContent.hero_headline,
          hero_subheadline: data.hero_subheadline || defaultContent.hero_subheadline,
          hero_rotating_words: data.hero_rotating_words?.length
            ? data.hero_rotating_words
            : defaultContent.hero_rotating_words,
        });
      }
    };
    fetchContent();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWord((prev) => (prev + 1) % content.hero_rotating_words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [content.hero_rotating_words.length]);

  return (
    <Reveal>
      <section className="pt-16 sm:pt-20 pb-8 sm:pb-10 text-center px-6">
        {/* Small label above */}
        <span className="text-lg sm:text-xl md:text-2xl font-light tracking-wide mb-4 block text-muted-foreground">
          {content.hero_headline}
        </span>

        {/* MASSIVE shifting headline */}
        <h2 className="text-[12vw] sm:text-[10vw] md:text-[9vw] lg:text-[8vw] font-bold tracking-tighter leading-[0.9] text-foreground uppercase">
          <span className="block">
            #{content.hero_subheadline}{' '}
            <span
              key={activeWord}
              className="inline-block animate-fade-in text-primary"
            >
              {content.hero_rotating_words[activeWord]}
            </span>
          </span>
        </h2>
      </section>
    </Reveal>
  );
}