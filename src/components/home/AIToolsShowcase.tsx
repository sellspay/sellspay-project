import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Reveal } from './Reveal';
import { ArrowUpRight } from 'lucide-react';
import toolVocalImg from '@/assets/tool-vocal-isolator.jpg';
import toolStemImg from '@/assets/tool-stem-splitter.jpg';
import toolImageImg from '@/assets/tool-image-gen.jpg';
import toolSfxImg from '@/assets/tool-sfx-gen.jpg';

const tools = [
  { label: 'Vocal Isolator', path: '/tools', image: toolVocalImg },
  { label: 'Stem Splitter', path: '/tools', image: toolStemImg },
  { label: 'AI Image', path: '/studio', image: toolImageImg },
  { label: 'AI SFX', path: '/studio', image: toolSfxImg },
];

export function AIToolsShowcase() {
  return (
    <Reveal>
      <section className="px-6 sm:px-8 lg:px-10 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            AI-Powered Tools
          </h2>
          <Link
            to="/studio"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            View All <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.label}
              to={tool.path}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-border/30 bg-card hover:border-border/60 transition-all duration-300"
            >
              {/* Header with title & arrow */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4">
                <h3 className="text-sm sm:text-base font-bold text-foreground">{tool.label}</h3>
                <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>

              {/* Image area */}
              <div className="relative aspect-[5/4] overflow-hidden">
                <img
                  src={tool.image}
                  alt={tool.label}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
