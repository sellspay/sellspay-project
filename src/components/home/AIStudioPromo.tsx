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
        <div className="relative z-10 px-6 sm:px-8 lg:px-16 xl:px-24">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            {/* Left: Two-line headline */}
            <div>
              <h2 
                className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl text-foreground leading-[1.15] tracking-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                <span className="whitespace-nowrap">Thousands of creators</span>
                <br />
                <span className="whitespace-nowrap">choose <span className="text-primary">SellsPay</span></span>
              </h2>
            </div>
            
            {/* Right: Checkmark list - vertically centered */}
            <div className="space-y-6 lg:space-y-7">
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
