import { Check, Sparkles, Zap, Layers } from 'lucide-react';
import { Reveal } from './Reveal';

const benefits = [
  { icon: Sparkles, text: 'The complete creative AI ecosystem' },
  { icon: Zap, text: 'Always evolving with advanced AI models' },
  { icon: Layers, text: 'Built for you to create the impossible' },
];

export function AIStudioPromo() {
  return (
    <Reveal>
      <section className="relative py-32 sm:py-48 lg:py-64 overflow-hidden">
        {/* Layered gradient glow effect */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Primary glow - large and soft */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[200%] opacity-30"
            style={{
              background: 'radial-gradient(ellipse 50% 40% at 50% 50%, hsl(var(--primary)), transparent 60%)',
              filter: 'blur(80px)',
            }}
          />
          {/* Secondary accent glow */}
          <div 
            className="absolute top-1/3 right-1/4 w-[40%] h-[60%] opacity-20"
            style={{
              background: 'radial-gradient(circle at center, hsl(var(--primary) / 0.8), transparent 50%)',
              filter: 'blur(100px)',
            }}
          />
        </div>
        
        <div className="relative z-10 px-6 sm:px-8 lg:px-16">
          <div className="max-w-[1600px] mx-auto">
            {/* Massive stacked headline */}
            <div className="text-center mb-20 sm:mb-32">
              <p className="text-primary uppercase tracking-[0.3em] text-sm sm:text-base font-medium mb-8">
                Join the movement
              </p>
              <h2 
                className="text-[12vw] sm:text-[10vw] lg:text-[8vw] text-foreground leading-[0.9] tracking-[-0.03em]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Thousands
              </h2>
              <h2 
                className="text-[12vw] sm:text-[10vw] lg:text-[8vw] text-foreground leading-[0.9] tracking-[-0.03em] -mt-2 sm:-mt-4"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                of creators
              </h2>
              <h2 
                className="text-[12vw] sm:text-[10vw] lg:text-[8vw] leading-[0.9] tracking-[-0.03em] -mt-2 sm:-mt-4"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                <span className="text-foreground">choose </span>
                <span className="text-primary italic">SellsPay</span>
              </h2>
            </div>
            
            {/* Benefits in horizontal layout */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 lg:gap-24">
              {benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center text-center gap-4 max-w-xs"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-lg sm:text-xl text-foreground/80 font-medium leading-snug">
                    {benefit.text}
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
