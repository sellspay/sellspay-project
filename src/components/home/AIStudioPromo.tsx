import { Reveal } from './Reveal';
import { useNavigate } from 'react-router-dom';
import promoWave from '@/assets/promo-wave.png';

export function AIStudioPromo() {
  const navigate = useNavigate();

  return (
    <Reveal>
      <section className="relative py-32 sm:py-40 lg:py-52 overflow-hidden">
        {/* Background wave graphic - full width */}
        <img 
          src={promoWave} 
          alt="" 
          aria-hidden="true"
          className="absolute top-1/2 left-0 right-0 -translate-y-1/2 w-full h-auto opacity-40 pointer-events-none select-none object-cover"
        />
        
        {/* Full width container - no max-width constraint */}
        <div className="relative z-10">
          
          {/* Main Headline - Full bleed with edge padding only */}
          <div className="px-6 sm:px-12 lg:px-20 mb-20 sm:mb-28">
            <h2 
              className="text-foreground leading-[1.1] tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              <span className="block text-4xl sm:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl">Thousands of creators</span>
              <span className="block mt-2">
                <span className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl">choose </span>
                <span 
                  className="text-primary text-6xl sm:text-7xl lg:text-8xl xl:text-9xl 2xl:text-[10rem]"
                  style={{ fontFamily: "'Georgia', serif" }}
                >SellsPay</span>
              </span>
            </h2>
          </div>

          {/* Editorial text - full width split */}
          <div className="px-6 sm:px-12 lg:px-20 mb-24 sm:mb-32">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12 lg:gap-24">
              <p className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-foreground leading-relaxed font-light lg:max-w-[50%]">
                Stop jumping between platforms. Your storefront, tools, and payments — 
                <span className="text-primary font-medium"> unified.</span>
              </p>
              <div className="lg:max-w-[40%]">
                {/* Start Selling - Large text link above the paragraphs */}
                <button
                  onClick={() => navigate('/signup')}
                  className="text-2xl sm:text-3xl lg:text-4xl text-foreground underline decoration-2 underline-offset-[12px] hover:text-primary hover:decoration-primary transition-colors duration-300 cursor-pointer mb-10 block"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Start Selling
                </button>

                <div className="space-y-6">
                  <p className="text-base sm:text-lg lg:text-xl text-foreground/90 leading-relaxed">
                    We built SellsPay for creators who are tired of stitching together 
                    five different services just to sell a preset pack.
                  </p>
                  <p className="text-base sm:text-lg lg:text-xl text-foreground/90 leading-relaxed">
                    Sell. Create with AI tools. Get paid instantly. No more going site to site.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats - edge to edge with dividers */}
          <div className="border-t border-border/30">
            <div className="grid grid-cols-3 divide-x divide-border/30">
              <div className="px-6 sm:px-12 lg:px-20 py-12 sm:py-16 lg:py-20">
                <div className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light text-foreground mb-3">0%</div>
                <div className="text-sm sm:text-base lg:text-lg text-foreground/70">fees for Enterprise</div>
              </div>
              <div className="px-6 sm:px-12 lg:px-20 py-12 sm:py-16 lg:py-20">
                <div className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light text-foreground mb-3">180+</div>
                <div className="text-sm sm:text-base lg:text-lg text-foreground/70">countries supported</div>
              </div>
              <div className="px-6 sm:px-12 lg:px-20 py-12 sm:py-16 lg:py-20">
                <div className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light text-foreground mb-3">∞</div>
                <div className="text-sm sm:text-base lg:text-lg text-foreground/70">products per creator</div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </Reveal>
  );
}
