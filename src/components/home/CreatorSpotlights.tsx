import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Reveal } from './Reveal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { Quote, ArrowRight } from 'lucide-react';

interface Spotlight {
  id: string;
  headline: string;
  quote: string | null;
  achievement: string | null;
  profile: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    verified: boolean | null;
  } | null;
}

export function CreatorSpotlights() {
  const [spotlights, setSpotlights] = useState<Spotlight[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('creator_spotlights')
        .select('id, headline, quote, achievement, profile_id')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(3);

      if (!data || data.length === 0) return;

      // Fetch profiles for spotlights
      const profileIds = data.map(s => s.profile_id);
      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('id, username, full_name, avatar_url, verified')
        .in('id', profileIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      setSpotlights(data.map(s => ({
        ...s,
        profile: profileMap.get(s.profile_id) || null,
      })));
    }
    fetch();
  }, []);

  if (spotlights.length === 0) return null;

  return (
    <Reveal>
      <section className="px-6 sm:px-8 lg:px-10 pb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Creator Spotlights</h2>
          <Link to="/explore" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {spotlights.map((spot) => (
            <Link
              key={spot.id}
              to={spot.profile?.username ? `/${spot.profile.username}` : '#'}
              className="group relative flex flex-col justify-between p-6 rounded-xl border border-border/40 bg-card hover:border-primary/30 transition-all duration-300"
            >
              {spot.quote && (
                <div className="mb-4">
                  <Quote className="h-5 w-5 text-primary/40 mb-2" />
                  <p className="text-sm text-muted-foreground italic leading-relaxed line-clamp-3">
                    "{spot.quote}"
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border/30">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={spot.profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-muted text-xs">
                    {(spot.profile?.full_name || spot.profile?.username || '?')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {spot.profile?.full_name || spot.profile?.username || 'Creator'}
                    </span>
                    {spot.profile?.verified && <VerifiedBadge size="sm" />}
                  </div>
                  {spot.achievement && (
                    <p className="text-[11px] text-primary font-medium truncate">{spot.achievement}</p>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
