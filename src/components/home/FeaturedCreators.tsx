import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Reveal } from './Reveal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { ArrowRight } from 'lucide-react';
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
        .limit(6);

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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <Reveal className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12 sm:mb-16">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-2">
              Meet our creators
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              The people behind the products
            </p>
          </div>
          <Button asChild variant="ghost" className="group hidden sm:flex">
            <Link to="/creators">
              View All
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </Reveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8">
          {creators.map((creator, index) => {
            if (!creator.username) return null;
            
            return (
              <Reveal key={creator.id} delay={index * 80}>
                <Link
                  to={`/@${creator.username}`}
                  className="group flex flex-col items-center text-center"
                >
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 mb-4 ring-2 ring-border group-hover:ring-foreground/30 transition-all duration-300">
                    <AvatarImage src={creator.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xl font-medium">
                      {(creator.full_name || creator.username || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-medium text-foreground text-sm sm:text-base group-hover:underline">
                      {creator.full_name || creator.username}
                    </span>
                    {creator.verified && <VerifiedBadge size="sm" isOwner={creator.isAdmin} />}
                  </div>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    @{creator.username}
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-12 text-center sm:hidden">
          <Button asChild variant="outline">
            <Link to="/creators">View All Creators</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
