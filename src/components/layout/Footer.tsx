import { Link } from 'react-router-dom';
import { Twitter, Instagram, Youtube } from 'lucide-react';

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

      <div className="mx-auto max-w-6xl px-6 lg:px-8 py-16 lg:py-20">
        {/* Main Content - Centered Layout */}
        <div className="flex flex-col items-center text-center space-y-10">
          {/* Brand */}
          <Link to="/" className="group">
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
              Sellspay
            </span>
          </Link>

          {/* Navigation Links - Inline */}
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3">
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

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-muted/30 text-muted-foreground transition-all duration-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-600 hover:to-violet-500 hover:shadow-[0_0_20px_rgba(147,51,234,0.5),0_0_40px_rgba(147,51,234,0.25)]"
                aria-label={social.name}
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-border/10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <p className="text-xs text-muted-foreground/50">
              © {new Date().getFullYear()} Sellspay
            </p>
            <span className="hidden sm:block text-muted-foreground/20">·</span>
            <div className="flex items-center gap-6">
              {legalLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
