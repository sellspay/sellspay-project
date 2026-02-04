import { Check } from 'lucide-react';
import { Reveal } from './Reveal';

const benefits = [
  'The complete creative AI ecosystem',
  'Always evolving with advanced AI models',
  'Built for you to create the impossible',
];

export function AIStudioPromo() {
  return (
    <Reveal>
      <section className="relative py-32 sm:py-40 lg:py-52 overflow-hidden">
        {/* Centered glow effect like reference */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-40 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, hsl(var(--primary) / 0.5), transparent 60%)',
            filter: 'blur(80px)',
          }}
        />
        
        <div className="relative z-10 px-6 sm:px-8 lg:px-16">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start justify-between gap-16 lg:gap-32">
            {/* Left: Two-line headline, left-aligned */}
            <div className="flex-1">
              <h2 
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-foreground leading-[1.15] tracking-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Thousands of creators
                <br />
                choose SellsPay
              </h2>
            </div>
            
            {/* Right: Checkmark list */}
            <div className="flex-shrink-0 space-y-6 lg:space-y-8 lg:pt-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-base sm:text-lg lg:text-xl text-foreground font-medium">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
