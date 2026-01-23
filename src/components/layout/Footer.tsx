import { Link } from 'react-router-dom';
import { Twitter, Instagram, Youtube } from 'lucide-react';

const exploreLinks = [
  { name: 'Products', path: '/products' },
  { name: 'Creators', path: '/creators' },
  { name: 'Work with Editors', path: '/work-with-editors' },
  { name: 'Notifications', path: '/notifications' },
];

const audioToolLinks = [
  { name: 'Voice Isolator', path: '/tools/voice-isolator' },
  { name: 'Music Splitter', path: '/tools/music-splitter' },
  { name: 'Pitch Shifter', path: '/tools/pitch-shifter' },
  { name: 'Key/BPM Finder', path: '/tools/key-bpm-finder' },
  { name: 'Audio Cutter', path: '/tools/audio-cutter' },
  { name: 'Audio Joiner', path: '/tools/audio-joiner' },
  { name: 'Audio Recorder', path: '/tools/audio-recorder' },
];

const generatorLinks = [
  { name: 'Shape Scene Generator', path: '/tools/shape-scene-generator' },
  { name: 'Manga Generator', path: '/tools/manga-generator' },
  { name: 'Manhwa Generator', path: '/tools/manhwa-generator' },
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
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link to="/" className="inline-block">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                EditorsParadise
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              Premium creator tools and digital products for editors and content creators.
            </p>
            <div className="flex gap-4 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Explore
            </h3>
            <ul className="space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Audio Tools */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Audio Tools
            </h3>
            <ul className="space-y-3">
              {audioToolLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Generators */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Generators
            </h3>
            <ul className="space-y-3">
              {generatorLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/40">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} EditorsParadise. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
