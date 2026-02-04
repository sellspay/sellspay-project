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
    <section className="py-20 sm:py-28 lg:py-36">
      <div className="px-4 sm:px-8 lg:px-12">
        <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14 sm:mb-20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground tracking-tight mb-2">
                Meet Our Creators
              </h2>
              <p className="text-muted-foreground text-lg sm:text-xl">
                The talented people behind the products
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="rounded-full px-8 h-12 text-base font-medium group border-2">
            <Link to="/creators">
              View All Creators
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </Reveal>

        {/* Creator Grid - BIGGER avatars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 sm:gap-8">
          {creators.map((creator, index) => {
            if (!creator.username) return null;
            
            return (
              <Reveal key={creator.id} delay={index * 60}>
                <Link
                  to={`/@${creator.username}`}
                  className="group flex flex-col items-center text-center"
                >
                  <Avatar className="h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 mb-5 ring-3 ring-border group-hover:ring-primary/50 transition-all duration-300 group-hover:scale-105">
                    <AvatarImage src={creator.avatar_url || undefined} />
                    <AvatarFallback className="bg-card text-muted-foreground text-2xl font-semibold">
                      {(creator.full_name || creator.username || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-semibold text-foreground text-base sm:text-lg group-hover:text-primary transition-colors">
                      {creator.full_name || creator.username}
                    </span>
                    {creator.verified && <VerifiedBadge size="sm" isOwner={creator.isAdmin} />}
                  </div>
                  <span className="text-sm text-muted-foreground">
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
