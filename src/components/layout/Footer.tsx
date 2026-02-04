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
    <footer className="border-t border-border/30 bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Single Row Layout */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left: Logo */}
          <div className="flex flex-col items-center lg:items-start gap-2">
            <Link to="/" className="group">
              <img 
                src={sellspayLogo} 
                alt="SellsPay" 
                className="h-8 sm:h-10 w-auto opacity-80 group-hover:opacity-100 transition-opacity"
              />
            </Link>
            <p className="text-xs text-muted-foreground/50">
              © {new Date().getFullYear()} SellsPay
            </p>
          </div>

          {/* Center: Nav + Legal Links */}
          <div className="flex flex-col items-center gap-4">
            <nav className="flex flex-wrap justify-center gap-6 sm:gap-8">
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
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground/50">
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
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-card transition-all duration-200"
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
