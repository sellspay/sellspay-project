import { useNavigate } from 'react-router-dom';
import { Reveal } from './Reveal';
import { Music, ImageIcon, Mic, Scissors, Volume2, Wand2 } from 'lucide-react';

const tools = [
  { icon: Mic, label: 'Vocal Isolator', desc: 'Extract clean vocals from any track', path: '/tools', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
  { icon: Music, label: 'Stem Splitter', desc: 'Separate drums, bass, vocals & more', path: '/tools', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  { icon: ImageIcon, label: 'Image Generator', desc: 'Create stunning visuals with AI', path: '/studio', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
  { icon: Volume2, label: 'SFX Generator', desc: 'Generate custom sound effects instantly', path: '/studio', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { icon: Scissors, label: 'Audio Cutter', desc: 'Trim & edit audio with precision', path: '/tools', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { icon: Wand2, label: 'Background Remover', desc: 'Remove backgrounds in one click', path: '/studio', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
];

export function AIToolsShowcase() {
  const navigate = useNavigate();

  return (
    <Reveal>
      <section className="px-6 sm:px-8 lg:px-10 pb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">AI-Powered Tools</h2>
            <p className="text-sm text-muted-foreground mt-1">Professional creative tools at your fingertips</p>
          </div>
          <button
            onClick={() => navigate('/studio')}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View All →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {tools.map((tool) => (
            <button
              key={tool.label}
              onClick={() => navigate(tool.path)}
              className={`group flex flex-col items-center gap-3 p-5 rounded-xl border ${tool.bg} hover:scale-[1.03] transition-all duration-300 text-center`}
            >
              <div className={`p-3 rounded-xl bg-background/50 ${tool.color}`}>
                <tool.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{tool.label}</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{tool.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
