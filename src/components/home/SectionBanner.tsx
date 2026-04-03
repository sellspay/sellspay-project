import { Link } from 'react-router-dom';
import { Reveal } from './Reveal';
import { Button } from '@/components/ui/button';

interface SectionBannerProps {
  image: string;
  headline: string;
  subtitle?: string;
  ctaLabel: string;
  ctaLink: string;
}

export function SectionBanner({ image, headline, subtitle, ctaLabel, ctaLink }: SectionBannerProps) {
  return (
    <Reveal>
      <section className="px-6 sm:px-8 lg:px-10 pb-10">
        <Link
          to={ctaLink}
          className="group relative block w-full overflow-hidden rounded-2xl"
          style={{ aspectRatio: '21/6' }}
        >
          <img
            src={image}
            alt={headline}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />

          <div className="relative z-10 flex flex-col justify-center h-full px-8 sm:px-12 max-w-lg">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight leading-tight mb-2">
              {headline}
            </h2>
            {subtitle && (
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-5 max-w-sm">
                {subtitle}
              </p>
            )}
            <Button
              className="w-fit rounded-full px-6 h-10 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
              asChild
            >
              <span>{ctaLabel}</span>
            </Button>
          </div>
        </Link>
      </section>
    </Reveal>
  );
}
