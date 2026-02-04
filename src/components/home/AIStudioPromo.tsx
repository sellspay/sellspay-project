import { Reveal } from './Reveal';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function AIStudioPromo() {
  const navigate = useNavigate();

  return (
    <Reveal>
      <section className="relative py-32 sm:py-40 lg:py-52 overflow-hidden">
        <div className="relative z-10 px-6 sm:px-8 lg:px-16">
          <div className="max-w-7xl mx-auto">
            
            {/* Main Headline - Left aligned, editorial */}
            <div className="mb-20 sm:mb-28">
              <h2 
                className="text-foreground leading-[1.1] tracking-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                <span className="block text-4xl sm:text-5xl lg:text-6xl xl:text-7xl">Thousands of creators</span>
                <span className="block mt-2">
                  <span className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl">choose </span>
                  <span 
                    className="text-primary text-6xl sm:text-7xl lg:text-8xl xl:text-9xl"
                    style={{ fontFamily: "'Georgia', serif" }}
                  >SellsPay</span>
                </span>
              </h2>
            </div>

            {/* Editorial text columns */}
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 mb-24 sm:mb-32">
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl text-foreground leading-relaxed font-light">
                  Stop jumping between platforms. Your storefront, tools, and payments — 
                  <span className="text-primary font-medium"> unified.</span>
                </p>
              </div>
              <div className="space-y-6">
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  We built SellsPay for creators who are tired of stitching together 
                  five different services just to sell a preset pack.
                </p>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Sell. Create with AI tools. Get paid instantly. No more going site to site.
                </p>
              </div>
            </div>

            {/* Large typographic stats - minimal, no cards */}
            <div className="border-t border-border/30 pt-16 sm:pt-20">
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-light text-foreground mb-2">0%</div>
                  <div className="text-sm sm:text-base text-muted-foreground">fees for Enterprise</div>
                </div>
                <div>
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-light text-foreground mb-2">180+</div>
                  <div className="text-sm sm:text-base text-muted-foreground">countries supported</div>
                </div>
                <div>
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-light text-foreground mb-2">∞</div>
                  <div className="text-sm sm:text-base text-muted-foreground">products per creator</div>
                </div>
              </div>
            </div>

            {/* Placeholder - clean line, no card */}
            <div className="mt-24 sm:mt-32 pt-16 border-t border-dashed border-border/40">
              <p className="text-muted-foreground/50 text-sm uppercase tracking-widest">
                Additional elements — placeholder
              </p>
            </div>

            {/* CTA - minimal */}
            <div className="mt-20 sm:mt-24">
              <Button 
                onClick={() => navigate('/signup')}
                size="lg"
                className="px-14 h-16 text-lg font-medium"
              >
                Start Selling
              </Button>
            </div>

          </div>
        </div>
      </section>
    </Reveal>
  );
}
