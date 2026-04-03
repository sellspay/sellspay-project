import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Reveal } from './Reveal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Creator {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  verified: boolean | null;
  bio: string | null;
  isAdmin?: boolean;
}

export function FeaturedCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCreators() {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, user_id, username, full_name, avatar_url, verified, bio, is_owner')
        .eq('is_creator', true)
        .limit(8);

      if (error) {
        console.error('Failed to fetch creators:', error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setCreators(data.map(creator => ({
          ...creator,
          isAdmin: (creator as any).is_owner === true
        })));
      } else {
        setCreators([]);
      }
      setLoading(false);
    }

    fetchCreators();
  }, []);

  if (loading || creators.length === 0) return null;

  return (
    <section className="py-28 sm:py-36 lg:py-44">
      <div className="px-6 sm:px-8 lg:px-12 xl:px-16 max-w-[1400px] mx-auto">
        {/* Section Header */}
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-16 sm:mb-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary mb-4">
                Community
              </p>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-foreground tracking-tight leading-[1.05] mb-4">
                Meet Our Creators
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-lg leading-relaxed">
                The talented people behind the products
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full px-8 h-12 text-sm font-semibold group border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all shrink-0">
              <Link to="/creators">
                View All Creators
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </Reveal>

        {/* Creator Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 sm:gap-8">
          {creators.map((creator, index) => {
            if (!creator.username) return null;
            
            return (
              <Reveal key={creator.id} delay={index * 50}>
                <Link
                  to={`/@${creator.username}`}
                  className="group flex flex-col items-center text-center"
                >
                  <div className="relative mb-4">
                    <Avatar className="h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 ring-2 ring-border/30 group-hover:ring-primary/40 transition-all duration-500 group-hover:scale-105">
                      <AvatarImage src={creator.avatar_url || undefined} />
                      <AvatarFallback className="bg-card text-muted-foreground text-2xl font-semibold">
                        {(creator.full_name || creator.username || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-foreground text-sm sm:text-base group-hover:text-primary transition-colors duration-300 truncate max-w-[120px]">
                      {creator.full_name || creator.username}
                    </span>
                    {creator.verified && <VerifiedBadge size="sm" isOwner={creator.isAdmin} />}
                  </div>
                  <span className="text-xs text-muted-foreground/60">
                    @{creator.username}
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
