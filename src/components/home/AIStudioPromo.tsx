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
      <section className="relative py-32 sm:py-48 lg:py-56 overflow-hidden">
        <div className="relative z-10 px-6 sm:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12 lg:gap-20">
            {/* Left: Big headline */}
            <div className="flex-1">
              <h2 
                className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-foreground leading-[1.05] tracking-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Thousands of creators
                <br />
                choose <span className="text-primary">SellsPay</span>
              </h2>
            </div>
            
            {/* Right: Checkmark list */}
            <div className="flex-shrink-0 space-y-6 lg:space-y-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <Check className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <span className="text-xl sm:text-2xl text-foreground/90 font-medium">
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
