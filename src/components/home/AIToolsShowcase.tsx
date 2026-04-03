import { useNavigate } from 'react-router-dom';
import { Reveal } from './Reveal';
import { Music, ImageIcon, Mic, Scissors, Volume2, Wand2, ArrowRight } from 'lucide-react';

const tools = [
  { icon: Mic, label: 'Vocal Isolator', desc: 'Extract clean vocals from any track', path: '/tools', gradient: 'from-rose-500/20 to-rose-600/5', glow: 'bg-rose-500/30', iconColor: 'text-rose-400', ring: 'group-hover:ring-rose-500/30' },
  { icon: Music, label: 'Stem Splitter', desc: 'Separate drums, bass, vocals & more', path: '/tools', gradient: 'from-violet-500/20 to-violet-600/5', glow: 'bg-violet-500/30', iconColor: 'text-violet-400', ring: 'group-hover:ring-violet-500/30' },
  { icon: ImageIcon, label: 'Image Generator', desc: 'Create stunning visuals with AI', path: '/studio', gradient: 'from-sky-500/20 to-sky-600/5', glow: 'bg-sky-500/30', iconColor: 'text-sky-400', ring: 'group-hover:ring-sky-500/30' },
  { icon: Volume2, label: 'SFX Generator', desc: 'Generate custom sound effects instantly', path: '/studio', gradient: 'from-amber-500/20 to-amber-600/5', glow: 'bg-amber-500/30', iconColor: 'text-amber-400', ring: 'group-hover:ring-amber-500/30' },
  { icon: Scissors, label: 'Audio Cutter', desc: 'Trim & edit audio with precision', path: '/tools', gradient: 'from-emerald-500/20 to-emerald-600/5', glow: 'bg-emerald-500/30', iconColor: 'text-emerald-400', ring: 'group-hover:ring-emerald-500/30' },
  { icon: Wand2, label: 'Background Remover', desc: 'Remove backgrounds in one click', path: '/studio', gradient: 'from-pink-500/20 to-pink-600/5', glow: 'bg-pink-500/30', iconColor: 'text-pink-400', ring: 'group-hover:ring-pink-500/30' },
];

export function AIToolsShowcase() {
  const navigate = useNavigate();

  return (
    <Reveal>
      <section className="px-6 sm:px-8 lg:px-10 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">AI-Powered Tools</h2>
            <p className="text-sm text-muted-foreground mt-1">Professional creative tools at your fingertips</p>
          </div>
          <button
            onClick={() => navigate('/studio')}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <button
              key={tool.label}
              onClick={() => navigate(tool.path)}
              className={`group relative flex items-center gap-5 p-5 rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm hover:border-border/60 ring-1 ring-transparent ${tool.ring} transition-all duration-500 text-left overflow-hidden`}
            >
              {/* Ambient glow behind icon */}
              <div className={`absolute -left-4 top-1/2 -translate-y-1/2 w-24 h-24 ${tool.glow} rounded-full blur-[40px] opacity-0 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none`} />

              {/* Icon container */}
              <div className={`relative z-10 flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center border border-border/20`}>
                <tool.icon className={`h-6 w-6 ${tool.iconColor} transition-transform duration-300 group-hover:scale-110`} />
              </div>

              {/* Text */}
              <div className="relative z-10 flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground mb-0.5">{tool.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
              </div>

              {/* Arrow */}
              <ArrowRight className="relative z-10 h-4 w-4 text-muted-foreground/30 group-hover:text-foreground/60 transition-all duration-300 group-hover:translate-x-0.5 flex-shrink-0" />
            </button>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
