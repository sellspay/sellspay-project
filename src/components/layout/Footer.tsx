import { Link } from 'react-router-dom';
import { Twitter, Instagram, Youtube } from 'lucide-react';

const exploreLinks = [
  { name: 'Products', path: '/products' },
  { name: 'Creators', path: '/creators' },
  { name: 'Hire Editors', path: '/work-with-editors' },
  { name: 'Pricing', path: '/pricing' },
];

const audioToolLinks = [
  { name: 'Voice Isolator', path: '/tools/voice-isolator' },
  { name: 'Music Splitter', path: '/tools/music-splitter' },
  { name: 'Audio Cutter', path: '/tools/audio-cutter' },
  { name: 'Audio Joiner', path: '/tools/audio-joiner' },
  { name: 'Video to Audio', path: '/tools/video-to-audio' },
];

const legalLinks = [
  { name: 'Terms of Service', path: '/terms' },
  { name: 'Privacy Policy', path: '/privacy' },
  { name: 'Refund Policy', path: '/refunds' },
];

const socialLinks = [
  { name: 'Twitter', icon: Twitter, url: 'https://twitter.com/editorsparadise' },
  { name: 'Instagram', icon: Instagram, url: 'https://instagram.com/editorsparadise' },
  { name: 'YouTube', icon: Youtube, url: 'https://youtube.com/@editorsparadise' },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-border/20 bg-background overflow-hidden">
      {/* Subtle gradient accent */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-t from-primary/5 via-transparent to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block group">
              <span className="text-lg font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
                EditorsParadise
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground/80 leading-relaxed max-w-[200px]">
              Premium digital products for creators and editors.
            </p>
            <div className="flex gap-3 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                  aria-label={social.name}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-xs font-medium text-foreground uppercase tracking-widest mb-4">
              Explore
            </h3>
            <ul className="space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground/80 hover:text-foreground transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-xs font-medium text-foreground uppercase tracking-widest mb-4">
              Tools
            </h3>
            <ul className="space-y-3">
              {audioToolLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground/80 hover:text-foreground transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-medium text-foreground uppercase tracking-widest mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground/80 hover:text-foreground transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} EditorsParadise. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
