import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Reveal } from './Reveal';
import { Star, Quote } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { supabase } from '@/integrations/supabase/client';

interface Testimonial {
  id: string;
  name: string;
  username?: string;
  role: string;
  avatar?: string;
  rating: number;
  quote: string;
  featured?: boolean;
  verified?: boolean;
}

// Base testimonial for shrimpy (static)
const shrimpyTestimonial: Testimonial = {
  id: '1',
  name: 'Matthew',
  username: 'shrimpy',
  role: 'Video Editor & Creator',
  avatar: 'https://base44.app/api/apps/69633972141fd631aab3f377/files/public/69633972141fd631aab3f377/c4b776239_IMG_1579.jpg',
  rating: 5,
  quote: 'This platform changed how I share my work. The community here actually understands what editors need. Best decision I made for my creative business.',
  featured: true,
  verified: true,
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-muted/30 text-muted/30'
          }`}
        />
      ))}
    </div>
  );
}

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([shrimpyTestimonial]);

  useEffect(() => {
    async function fetchProfiles() {
      // Fetch deadeye and kagori profiles from DB
      const { data: profiles, error } = await supabase
        .from('public_profiles')
        .select('id, username, full_name, avatar_url, verified')
        .in('username', ['deadeye', 'kagori']);

      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }

      const dynamicTestimonials: Testimonial[] = [];

      const deadeyeProfile = profiles?.find(p => p.username === 'deadeye');
      if (deadeyeProfile) {
        dynamicTestimonials.push({
          id: '2',
          name: deadeyeProfile.full_name || 'Deadeye',
          username: deadeyeProfile.username || 'deadeye',
          role: 'Motion Designer & VFX Artist',
          avatar: deadeyeProfile.avatar_url || undefined,
          rating: 5,
          quote: 'Speed. I needed this.',
          verified: deadeyeProfile.verified || false,
        });
      }

      const kagoriProfile = profiles?.find(p => p.username === 'kagori');
      if (kagoriProfile) {
        dynamicTestimonials.push({
          id: '3',
          name: kagoriProfile.full_name || 'Kagori',
          username: kagoriProfile.username || 'kagori',
          role: 'Video Editor',
          avatar: kagoriProfile.avatar_url || undefined,
          rating: 5,
          quote: 'I sell my LUTs here and the platform takes care of everything. Payments, delivery, even handles customer questions. Just works.',
          verified: kagoriProfile.verified || false,
        });
      }

      setTestimonials([shrimpyTestimonial, ...dynamicTestimonials]);
    }

    fetchProfiles();
  }, []);

  const featured = testimonials.find(t => t.featured);
  const others = testimonials.filter(t => !t.featured);

  return (
    <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-muted/30 to-background" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <Reveal className="text-center mb-10 sm:mb-16 lg:mb-20">
          <p className="text-primary font-medium mb-3 sm:mb-4 tracking-wide uppercase text-xs sm:text-sm">
            Real Feedback
          </p>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-4 sm:mb-6 tracking-tight">
            Creators Love Us
          </h2>
          <p className="text-sm sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Don't just take our word for it
          </p>
        </Reveal>

        {/* Testimonials grid - asymmetric bento style */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Featured testimonial - large */}
          {featured && (
            <Reveal delay={100} className="lg:col-span-7">
              <div className="relative h-full p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 overflow-hidden">
                {/* Decorative quote */}
                <Quote className="absolute top-4 sm:top-6 right-4 sm:right-6 h-16 w-16 sm:h-24 sm:w-24 text-primary/10" />
                
                <div className="relative z-10">
                  <StarRating rating={featured.rating} />
                  
                  <blockquote className="mt-5 sm:mt-8 mb-6 sm:mb-10">
                    <p className="text-base sm:text-xl lg:text-2xl xl:text-3xl font-medium text-foreground leading-relaxed">
                      "{featured.quote}"
                    </p>
                  </blockquote>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-11 w-11 sm:h-14 sm:w-14 ring-2 ring-primary/20">
                        <AvatarImage src={featured.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-base sm:text-lg font-semibold">
                          {featured.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="font-semibold text-foreground text-sm sm:text-lg">
                            @{featured.username || featured.name.toLowerCase().replace(' ', '')}
                          </span>
                          {featured.verified && (
                            <VerifiedBadge size="md" />
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {featured.role}
                        </div>
                      </div>
                    </div>
                    {featured.username && (
                      <Button asChild variant="outline" size="sm" className="hidden lg:flex">
                        <Link to={`/@${featured.username}`}>
                          View Profile
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {/* Other testimonials - stacked */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            {others.map((testimonial, index) => (
              <Reveal key={testimonial.id} delay={200 + index * 100}>
                <div className="relative p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl bg-card/80 border border-border/50 hover:border-primary/50 transition-colors">
                  <StarRating rating={testimonial.rating} />
                  
                  <blockquote className="mt-4 sm:mt-5 mb-4 sm:mb-6">
                    <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                  </blockquote>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                        <AvatarImage src={testimonial.avatar} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground text-sm">
                            {testimonial.username ? `@${testimonial.username}` : testimonial.name}
                          </span>
                          {testimonial.verified && (
                            <VerifiedBadge size="sm" />
                          )}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                    {testimonial.username && (
                      <Button asChild variant="ghost" size="sm" className="text-xs">
                        <Link to={`/@${testimonial.username}`}>
                          View Profile
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
