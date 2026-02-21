import { Link } from 'react-router-dom';
import { Twitter, Instagram, Youtube, ArrowRight } from 'lucide-react';
import sellspayLogo from '@/assets/sellspay-s-logo-new.png';

const platformLinks = [
  { name: 'Marketplace', path: '/products' },
  { name: 'Creators', path: '/creators' },
  { name: 'AI Builder', path: '/ai-builder' },
  { name: 'Pricing', path: '/pricing' },
];

const resourceLinks = [
  { name: 'AI Studio', path: '/studio' },
  { name: 'Hire Editors', path: '/hire-editors' },
  { name: 'Community', path: '/community/updates' },
  { name: 'FAQ', path: '/faq' },
];

const legalLinks = [
  { name: 'Terms', path: '/terms' },
  { name: 'Privacy', path: '/privacy' },
  { name: 'Refunds', path: '/refunds' },
  { name: 'Seller Agreement', path: '/seller-agreement' },
];

const socialLinks = [
  { name: 'Twitter', icon: Twitter, url: 'https://twitter.com/sellspay' },
  { name: 'Instagram', icon: Instagram, url: 'https://instagram.com/sellspay' },
  { name: 'YouTube', icon: Youtube, url: 'https://youtube.com/@sellspay' },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-border/20">
      {/* Top accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        {/* Main grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 py-14 sm:py-20">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-5">
            <Link to="/" className="inline-block w-fit group">
              <img
                src={sellspayLogo}
                alt="SellsPay"
                className="h-8 w-auto opacity-80 group-hover:opacity-100 transition-opacity"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">
              The all-in-one marketplace for digital creators.
            </p>
            <div className="flex items-center gap-3 mt-1">
              {socialLinks.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="h-9 w-9 flex items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-200"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">
              Platform
            </h4>
            <nav className="flex flex-col gap-2.5">
              {platformLinks.map((l) => (
                <Link
                  key={l.path}
                  to={l.path}
                  className="text-sm text-foreground/60 hover:text-foreground transition-colors duration-200 w-fit"
                >
                  {l.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">
              Resources
            </h4>
            <nav className="flex flex-col gap-2.5">
              {resourceLinks.map((l) => (
                <Link
                  key={l.path}
                  to={l.path}
                  className="text-sm text-foreground/60 hover:text-foreground transition-colors duration-200 w-fit"
                >
                  {l.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">
              Legal
            </h4>
            <nav className="flex flex-col gap-2.5">
              {legalLinks.map((l) => (
                <Link
                  key={l.path}
                  to={l.path}
                  className="text-sm text-foreground/60 hover:text-foreground transition-colors duration-200 w-fit"
                >
                  {l.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-border/15">
          <p className="text-xs text-muted-foreground/40">
            © {new Date().getFullYear()} SellsPay. All rights reserved.
          </p>
          <Link
            to="/signup"
            className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors"
          >
            Start selling today
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
