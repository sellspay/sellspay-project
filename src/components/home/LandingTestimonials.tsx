import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';

const testimonials = [
  {
    quote: "The auto stem splitting is like magic. I uploaded a full mix and got perfectly isolated vocals in seconds. Saved me hours of manual work!",
    name: "Alex Rivera",
    role: "Music Producer",
    rating: 5,
  },
  {
    quote: "I've been looking for a platform that handles both selling my presets AND providing AI tools. SellsPay does it all. Never going back.",
    name: "Maya Chen",
    role: "Color Grading Artist",
    rating: 5,
  },
  {
    quote: "The AI storefront builder blew my mind. I described my brand aesthetic and had a professional-looking page in under a minute. Incredible.",
    name: "Jordan Brooks",
    role: "Digital Creator",
    rating: 5,
  },
  {
    quote: "Finally a marketplace that actually cares about independent creators. The payout system is fast, the fees are fair, and the tools are world-class.",
    name: "Sam Okafor",
    role: "SFX Designer",
    rating: 5,
  },
];

export function LandingTestimonials() {
  return (
    <section className="py-28 sm:py-36 lg:py-44">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center mb-16 sm:mb-20">
          <h2 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-foreground tracking-tight leading-[1.1] mb-5">
            Voice of Our Users
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
            SellsPay is loved by creators worldwide for its powerful tools and seamless selling experience.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            Try online for free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="flex flex-col p-7 sm:p-8 rounded-2xl border border-border/15 bg-card/50 hover:border-border/30 transition-colors duration-300"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-base text-foreground/90 leading-relaxed flex-1 mb-6">
                "{t.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-5 border-t border-border/15">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
