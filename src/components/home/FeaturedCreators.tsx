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
      // Use public_profiles view - includes is_owner computed field
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
    <section className="py-20 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <Reveal className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Featured Creators
            </h2>
            <p className="text-lg text-muted-foreground">
              Meet the talented people behind the products
            </p>
          </div>
          <Button asChild variant="ghost" className="group hidden sm:flex">
            <Link to="/creators">
              View All
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </Reveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6">
          {creators.map((creator, index) => {
            // Only render creators with a valid username for proper routing
            if (!creator.username) return null;
            
            return (
              <Reveal key={creator.id} delay={index * 80} blur>
                <Link
                  to={`/@${creator.username}`}
                  className="group flex flex-col items-center text-center p-4 rounded-2xl border border-transparent hover:border-border hover:bg-card/50 transition-all duration-300"
                >
                  <Avatar className="h-20 w-20 lg:h-24 lg:w-24 mb-4 ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
                    <AvatarImage src={creator.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                      {(creator.full_name || creator.username || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-medium text-foreground text-sm lg:text-base truncate max-w-[100px]">
                      {creator.full_name || creator.username || 'Creator'}
                    </span>
                    {creator.verified && <VerifiedBadge size="sm" isOwner={creator.isAdmin} />}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    @{creator.username}
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Button asChild variant="outline">
            <Link to="/creators">View All Creators</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
