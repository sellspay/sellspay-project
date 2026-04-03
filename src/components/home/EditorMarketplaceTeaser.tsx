import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Reveal } from './Reveal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Headphones } from 'lucide-react';

interface Editor {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  editor_services: string[] | null;
  editor_hourly_rate_cents: number | null;
}

export function EditorMarketplaceTeaser() {
  const navigate = useNavigate();
  const [editors, setEditors] = useState<Editor[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, editor_services, editor_hourly_rate_cents')
        .eq('is_editor', true)
        .limit(6);

      setEditors(data || []);
    }
    fetch();
  }, []);

  if (editors.length === 0) return null;

  return (
    <Reveal>
      <section className="px-6 sm:px-8 lg:px-10 pb-10">
        <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card to-primary/[0.03] p-8 sm:p-10">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-[60px] pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Headphones className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Editor Marketplace</span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-lg">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
                  Hire a Pro Editor
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Browse vetted audio & video editors ready to bring your vision to life. Book by the hour, chat directly, and get professional results.
                </p>
              </div>

              <div className="flex items-center gap-6">
                {/* Stacked avatars */}
                <div className="flex -space-x-3">
                  {editors.slice(0, 5).map((editor) => (
                    <Avatar key={editor.id} className="h-10 w-10 border-2 border-background">
                      <AvatarImage src={editor.avatar_url || ''} />
                      <AvatarFallback className="bg-muted text-xs">
                        {(editor.full_name || editor.username || '?')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {editors.length > 5 && (
                    <div className="h-10 w-10 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs font-bold text-primary">
                      +{editors.length - 5}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => navigate('/editors')}
                  className="gap-2 px-6"
                >
                  Browse Editors
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
