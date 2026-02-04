import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Reveal } from './Reveal';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import aiStudioShowcase from '@/assets/ai-studio-showcase.png';

interface SiteToolsContent {
  tools_title: string;
  tools_subtitle: string;
}

export function ToolsShowcase() {
  const navigate = useNavigate();
  const [siteContent, setSiteContent] = useState<SiteToolsContent>({
    tools_title: 'AI Studio',
    tools_subtitle: 'Professional AI tools for modern creators',
  });

  // Fetch site content
  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase
        .from('site_content')
        .select('tools_title, tools_subtitle')
        .eq('id', 'main')
        .single();
      
      if (data) {
        setSiteContent({
          tools_title: data.tools_title || 'AI Studio',
          tools_subtitle: data.tools_subtitle || 'Professional AI tools for modern creators',
        });
      }
    };
    fetchContent();
  }, []);

  return (
    <Reveal>
      <section className="py-16 sm:py-24">
        <div className="px-4 sm:px-8 lg:px-12">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-7xl sm:text-8xl lg:text-9xl xl:text-[10rem] font-serif font-normal text-foreground tracking-tight italic">
              {siteContent.tools_title}
            </h2>
            <p className="text-xl sm:text-2xl text-muted-foreground mt-4 max-w-2xl mx-auto">
              {siteContent.tools_subtitle}
            </p>
            
            <div className="mt-8 flex items-center justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/tools')}
                className="h-auto py-4 px-12 text-lg rounded-none"
              >
                Explore Tools
              </Button>
            </div>
          </div>

          {/* Massive Showcase Image */}
          <div className="w-full max-w-7xl mx-auto">
            <img
              src={aiStudioShowcase}
              alt="AI Studio creative showcase"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </section>
    </Reveal>
  );
}
