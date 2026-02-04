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
      <section className="relative py-24 sm:py-32 lg:py-40 overflow-hidden">
        {/* Gradient glow effect */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, hsl(var(--primary) / 0.15), transparent 70%)',
          }}
        />
        
        <div className="relative z-10 px-6 sm:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12 lg:gap-20">
            {/* Left: Big headline */}
            <div className="flex-1">
              <h2 
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-foreground leading-[1.1] tracking-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Thousands of creators
                <br />
                choose <span className="text-primary">SellsPay</span>
              </h2>
            </div>
            
            {/* Right: Checkmark list */}
            <div className="flex-shrink-0 space-y-5 lg:space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-lg sm:text-xl text-foreground/90 font-medium">
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
