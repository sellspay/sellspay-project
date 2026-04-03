import { Reveal } from './Reveal';
import { useNavigate } from 'react-router-dom';
import promoWave from '@/assets/promo-wave.png';

export function AIStudioPromo() {
  const navigate = useNavigate();

  return (
    <Reveal>
      <section className="relative py-36 sm:py-44 lg:py-56 overflow-hidden">
        {/* Background wave graphic */}
        <img 
          src={promoWave} 
          alt="" 
          aria-hidden="true"
          className="absolute top-1/2 left-0 right-0 -translate-y-1/2 w-full h-auto opacity-30 pointer-events-none select-none object-cover"
        />
        
        <div className="relative z-10 max-w-[1400px] mx-auto">
          
          {/* Main Headline */}
          <div className="px-6 sm:px-12 lg:px-16 xl:px-20 mb-24 sm:mb-32">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary mb-6">
              The Platform
            </p>
            <h2 
              className="text-foreground leading-[1.05] tracking-tight"
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

          {/* Editorial text */}
          <div className="px-6 sm:px-12 lg:px-16 xl:px-20 mb-28 sm:mb-36">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-14 lg:gap-28">
              <p className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-foreground leading-relaxed font-light lg:max-w-[50%]">
                Stop jumping between platforms. Your storefront, tools, and payments — 
                <span className="text-primary font-medium"> unified.</span>
              </p>
              <div className="lg:max-w-[40%]">
                <button
                  onClick={() => navigate('/signup')}
                  className="text-2xl sm:text-3xl lg:text-4xl text-foreground underline decoration-1 underline-offset-[14px] decoration-border/50 hover:text-primary hover:decoration-primary transition-colors duration-500 cursor-pointer mb-12 block"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Start Selling
                </button>
                <div className="space-y-6">
                  <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed">
                    We built SellsPay for creators who are tired of stitching together 
                    five different services just to sell a preset pack.
                  </p>
                  <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed">
                    Sell. Create with AI tools. Get paid instantly. No more going site to site.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="border-t border-border/20">
            <div className="grid grid-cols-3 divide-x divide-border/20">
              {[
                { value: '0%', label: 'fees for Enterprise' },
                { value: '180+', label: 'countries supported' },
                { value: '∞', label: 'products per creator' },
              ].map((stat) => (
                <div key={stat.label} className="px-6 sm:px-12 lg:px-16 xl:px-20 py-14 sm:py-18 lg:py-24">
                  <div className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extralight text-foreground mb-3 tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm lg:text-base text-muted-foreground/60 uppercase tracking-wider font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
