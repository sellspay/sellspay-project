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
    <section className="py-24 sm:py-32 lg:py-40">
      <div className="px-6 sm:px-8 lg:px-12">
        {/* Section Header - MASSIVE */}
        <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-16 sm:mb-24">
          <div className="flex items-start gap-5">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground tracking-tight mb-3">
                Meet Our Creators
              </h2>
              <p className="text-xl sm:text-2xl text-muted-foreground">
                The talented people behind the products
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="rounded-full px-10 h-14 text-lg font-medium group border-2 hover:bg-primary/10 hover:border-primary/50 transition-all">
            <Link to="/creators">
              View All Creators
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </Reveal>

        {/* Creator Grid - MASSIVE avatars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-8 sm:gap-10">
          {creators.map((creator, index) => {
            if (!creator.username) return null;
            
            return (
              <Reveal key={creator.id} delay={index * 60}>
                <Link
                  to={`/@${creator.username}`}
                  className="group flex flex-col items-center text-center"
                >
                  <Avatar className="h-28 w-28 sm:h-32 sm:w-32 lg:h-36 lg:w-36 mb-6 ring-4 ring-border group-hover:ring-primary/50 transition-all duration-300 group-hover:scale-105">
                    <AvatarImage src={creator.avatar_url || undefined} />
                    <AvatarFallback className="bg-card text-muted-foreground text-3xl font-semibold">
                      {(creator.full_name || creator.username || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-foreground text-lg sm:text-xl group-hover:text-primary transition-colors">
                      {creator.full_name || creator.username}
                    </span>
                    {creator.verified && <VerifiedBadge size="sm" isOwner={creator.isAdmin} />}
                  </div>
                  <span className="text-base text-muted-foreground">
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
