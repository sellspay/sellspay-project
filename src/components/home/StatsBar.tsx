import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Users, Package, UserCheck, Download } from 'lucide-react';
import { Reveal } from './Reveal';

interface StatItem {
  label: string;
  value: number;
  suffix: string;
  icon: React.ReactNode;
}

function AnimatedCounter({ target, suffix, isVisible }: { target: number; suffix: string; isVisible: boolean }) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 2000;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [isVisible, target]);

  return (
    <span className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export function StatsBar() {
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.3,
    triggerOnce: true,
  });

  const [stats, setStats] = useState<StatItem[]>([
    { label: 'Verified Creators', value: 0, suffix: '+', icon: <UserCheck className="h-5 w-5" /> },
    { label: 'Premium Products', value: 0, suffix: '+', icon: <Package className="h-5 w-5" /> },
    { label: 'Community Members', value: 0, suffix: '+', icon: <Users className="h-5 w-5" /> },
    { label: 'Instant Downloads', value: 100, suffix: '%', icon: <Download className="h-5 w-5" /> },
  ]);

  useEffect(() => {
    async function fetchStats() {
      // Use security definer RPC to get accurate counts (bypasses RLS)
      const { data, error } = await supabase.rpc('get_home_stats');
      
      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }

      const statsData = data?.[0] || { verified_creators: 0, premium_products: 0, community_members: 0 };

      setStats([
        { label: 'Verified Creators', value: Number(statsData.verified_creators) || 0, suffix: '+', icon: <UserCheck className="h-5 w-5" /> },
        { label: 'Premium Products', value: Number(statsData.premium_products) || 0, suffix: '+', icon: <Package className="h-5 w-5" /> },
        { label: 'Community Members', value: Number(statsData.community_members) || 0, suffix: '+', icon: <Users className="h-5 w-5" /> },
        { label: 'Instant Downloads', value: 100, suffix: '%', icon: <Download className="h-5 w-5" /> },
      ]);
    }

    fetchStats();
  }, []);

  return (
    <Reveal>
      <section ref={ref} className="py-16 border-y border-border/50 bg-gradient-to-b from-background via-card/20 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-12">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="group relative flex flex-col items-center text-center gap-4 p-6 rounded-2xl transition-all duration-500 hover:bg-card/40 hover:shadow-xl hover:shadow-primary/5 cursor-default"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Icon container with premium styling */}
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 group-hover:border-primary/40 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-500">
                  <div className="text-primary group-hover:text-primary group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)] transition-all duration-300">
                    {stat.icon}
                  </div>
                </div>
                
                <div className="relative">
                  <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-accent transition-all duration-500">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} isVisible={isVisible} />
                  </div>
                  <div className="text-sm text-muted-foreground mt-2 group-hover:text-foreground/80 transition-colors duration-300 font-medium tracking-wide uppercase">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  );
}
