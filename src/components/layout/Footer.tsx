import { Link } from 'react-router-dom';
import { Twitter, Instagram, Youtube } from 'lucide-react';
import sellspayLogo from '@/assets/sellspay-s-logo.png';

const navLinks = [
  { name: 'Products', path: '/products' },
  { name: 'Creators', path: '/creators' },
  { name: 'Hire Editors', path: '/hire-editors' },
  { name: 'Tools', path: '/tools' },
];

const legalLinks = [
  { name: 'Terms', path: '/terms' },
  { name: 'Privacy', path: '/privacy' },
  { name: 'Refunds', path: '/refunds' },
];

const socialLinks = [
  { name: 'Twitter', icon: Twitter, url: 'https://twitter.com/sellspay' },
  { name: 'Instagram', icon: Instagram, url: 'https://instagram.com/sellspay' },
  { name: 'YouTube', icon: Youtube, url: 'https://youtube.com/@sellspay' },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-border/10 bg-background">
      {/* Subtle gradient accent */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-gradient-to-t from-primary/5 via-transparent to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6 lg:px-8 py-12">
        {/* Single Row Layout */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left: Logo + Powered by */}
          <div className="flex flex-col items-center lg:items-start gap-2">
            <Link to="/" className="group">
              <img 
                src={sellspayLogo} 
                alt="SellsPay" 
                className="h-10 w-auto group-hover:opacity-80 transition-opacity"
              />
            </Link>
            <p className="text-xs text-muted-foreground/50">
              Powered by{' '}
              <a 
                href="https://sellspay.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary/70 hover:text-primary font-medium transition-colors"
              >
                SellsPay
              </a>
            </p>
          </div>

          {/* Center: Nav + Legal Links */}
          <div className="flex flex-col items-center gap-3">
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-4 text-xs text-muted-foreground/40">
              <span>© {new Date().getFullYear()} SellsPay</span>
              <span>·</span>
              {legalLinks.map((link, index) => (
                <span key={link.path} className="flex items-center gap-4">
                  <Link
                    to={link.path}
                    className="hover:text-muted-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                  {index < legalLinks.length - 1 && <span>·</span>}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Social Icons */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-muted/20 text-muted-foreground/60 transition-all duration-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-600 hover:to-violet-500 hover:shadow-[0_0_15px_rgba(147,51,234,0.4)]"
                aria-label={social.name}
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
