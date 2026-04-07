import { Link } from 'react-router-dom';
import { Reveal } from './Reveal';
import { ArrowRight } from 'lucide-react';

const pillars = [
  {
    title: 'Create without limits',
    desc: 'Generate images, videos, audio and SFX with cutting-edge AI models — no plugins, no exports, no friction.',
  },
  {
    title: 'Sell what you make',
    desc: 'List digital products on a built-in marketplace with instant payouts, analytics, and a global audience of creators.',
  },
  {
    title: 'All workflows in one place',
    desc: 'Move from idea to finished product without switching tools. AI studio, storefront, and community — unified.',
  },
];

export function FeatureTabsBar() {
  return (
    <section className="py-28 sm:py-36 lg:py-44" style={{ background: '#000' }}>
      <div className="px-6 sm:px-8 lg:px-12 max-w-[1200px] mx-auto">
        {/* Heading + CTA */}
        <Reveal>
          <div className="mb-20 sm:mb-24">
            <h2 className="max-w-2xl">
              <span
                className="block text-[clamp(1.1rem,2vw,1.35rem)] uppercase tracking-[0.25em] text-white/70 font-medium mb-4"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                Why creators choose
              </span>
              <span
                className="block text-[clamp(3rem,7vw,5.5rem)] font-bold tracking-[-0.03em] leading-[1] text-white"
                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
              >
                SellsPay
              </span>
            </h2>

            <Link
              to="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-white tracking-wide transition-all hover:brightness-110 hover:scale-[1.03] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 30%, #1d4ed8 70%, #1e3a8a 100%)',
                boxShadow: '0 4px 20px rgba(59,130,246,0.4), 0 1px 3px rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.2)',
                border: '1px solid rgba(96,165,250,0.5)',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              Start Creating
            </Link>
          </div>
        </Reveal>

        {/* Three pillars */}
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-10 border-t border-white/[0.08] pt-12">
            {pillars.map((p) => (
              <div key={p.title} className="flex gap-4">
                <ArrowRight className="h-4 w-4 mt-1.5 shrink-0 text-white/40" />
                <div>
                  <h3 className="text-[15px] font-semibold text-white mb-2 tracking-[-0.01em]">
                    {p.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/40">
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
