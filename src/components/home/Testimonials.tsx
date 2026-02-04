import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Reveal } from './Reveal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { supabase } from '@/integrations/supabase/client';

interface Testimonial {
  id: string;
  name: string;
  username?: string;
  role: string;
  avatar?: string;
  quote: string;
  verified?: boolean;
}

// Static testimonial for shrimpy
const shrimpyTestimonial: Testimonial = {
  id: '1',
  name: 'Matthew',
  username: 'shrimpy',
  role: 'Video Editor & Creator',
  avatar: 'https://base44.app/api/apps/69633972141fd631aab3f377/files/public/69633972141fd631aab3f377/c4b776239_IMG_1579.jpg',
  quote: 'This platform changed how I share my work. The community here actually understands what editors need.',
  verified: true,
};

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([shrimpyTestimonial]);

  useEffect(() => {
    async function fetchProfiles() {
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
          role: 'Motion Designer',
          avatar: deadeyeProfile.avatar_url || undefined,
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
          quote: 'I sell my LUTs here and the platform takes care of everything. Just works.',
          verified: kagoriProfile.verified || false,
        });
      }

      setTestimonials([shrimpyTestimonial, ...dynamicTestimonials]);
    }

    fetchProfiles();
  }, []);

  return (
    <section className="py-20 sm:py-28 lg:py-36 bg-card/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <Reveal className="text-center mb-16 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Loved by creators
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            What our community has to say
          </p>
        </Reveal>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <Reveal key={testimonial.id} delay={index * 100}>
              <div className="group p-6 sm:p-8 rounded-2xl border border-border bg-card hover:border-foreground/20 transition-colors duration-300 h-full flex flex-col">
                {/* Quote */}
                <blockquote className="flex-1 mb-6">
                  <p className="text-foreground text-base sm:text-lg leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <Link to={testimonial.username ? `/@${testimonial.username}` : '#'}>
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                      <AvatarImage src={testimonial.avatar} />
                      <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                        {testimonial.name[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Link 
                        to={testimonial.username ? `/@${testimonial.username}` : '#'}
                        className="font-medium text-foreground hover:underline text-sm sm:text-base"
                      >
                        {testimonial.username ? `@${testimonial.username}` : testimonial.name}
                      </Link>
                      {testimonial.verified && <VerifiedBadge size="sm" />}
                    </div>
                    <div className="text-muted-foreground text-xs sm:text-sm">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
