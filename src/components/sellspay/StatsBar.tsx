import React from 'react';
import { motion } from 'framer-motion';

interface Stat {
  value: string;
  label: string;
}

interface StatsBarProps {
  stats: Stat[];
  variant?: 'dark' | 'glass' | 'minimal';
  className?: string;
}

export function StatsBar({
  stats,
  variant = 'dark',
  className = ''
}: StatsBarProps) {
  const variants = {
    dark: 'bg-card border-y border-border',
    glass: 'bg-background/50 backdrop-blur-xl border-y border-border/50',
    minimal: 'bg-transparent',
  };

  return (
    <section className={`py-12 ${variants[variant]} ${className}`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StatsBar;
