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
      // Fetch creators count
      const { count: creatorsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_seller', true);

      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      // Fetch total users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setStats([
        { label: 'Verified Creators', value: creatorsCount || 2, suffix: '+', icon: <UserCheck className="h-5 w-5" /> },
        { label: 'Premium Products', value: productsCount || 2, suffix: '+', icon: <Package className="h-5 w-5" /> },
        { label: 'Community Members', value: usersCount || 5, suffix: '+', icon: <Users className="h-5 w-5" /> },
        { label: 'Instant Downloads', value: 100, suffix: '%', icon: <Download className="h-5 w-5" /> },
      ]);
    }

    fetchStats();
  }, []);

  return (
    <Reveal>
      <section ref={ref} className="py-12 border-y border-border bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="flex flex-col items-center text-center gap-3"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  {stat.icon}
                </div>
                <div>
                  <div className="text-3xl lg:text-4xl font-bold text-foreground">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} isVisible={isVisible} />
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  );
}
