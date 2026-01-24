import { Reveal } from './Reveal';
import { Star, Quote } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  rating: number;
  quote: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Alex Rivera',
    role: 'Content Creator',
    rating: 5,
    quote: 'The quality of presets here is unmatched. My editing workflow has improved dramatically since I started using resources from this platform.',
  },
  {
    id: '2',
    name: 'Jordan Lee',
    role: 'Video Editor',
    rating: 5,
    quote: 'Finally a marketplace that understands what editors need. The instant downloads and verified creators make everything so smooth.',
  },
  {
    id: '3',
    name: 'Sam Chen',
    role: 'Filmmaker',
    rating: 4,
    quote: 'I\'ve bought project files from multiple sellers and every single one has been high quality. Great community of creators here.',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'fill-yellow-500 text-yellow-500'
              : 'fill-muted text-muted'
          }`}
        />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="py-20 lg:py-28 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <Reveal className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Loved by Creators
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what our community has to say
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <Reveal key={testimonial.id} delay={index * 100} blur>
              <div className="relative p-6 lg:p-8 rounded-2xl border border-border bg-card/80 backdrop-blur-sm h-full flex flex-col">
                {/* Quote icon */}
                <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/20" />
                
                {/* Rating */}
                <div className="mb-4">
                  <StarRating rating={testimonial.rating} />
                </div>

                {/* Quote */}
                <p className="text-foreground/90 leading-relaxed flex-1 mb-6">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
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
