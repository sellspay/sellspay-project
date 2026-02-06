import React from 'react';
import { Star } from 'lucide-react';

interface TestimonialCardProps {
  quote: string;
  author: string;
  avatar?: string;
  rating?: number;
  className?: string;
}

export function TestimonialCard({
  quote,
  author,
  avatar,
  rating = 5,
  className = ''
}: TestimonialCardProps) {
  return (
    <div className={`bg-card border border-border rounded-2xl p-6 ${className}`}>
      {rating > 0 && (
        <div className="flex gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star 
              key={i} 
              size={16} 
              className={i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'} 
            />
          ))}
        </div>
      )}
      <p className="text-muted-foreground mb-4 leading-relaxed">"{quote}"</p>
      <div className="flex items-center gap-3">
        {avatar && (
          <img 
            src={avatar} 
            alt={author} 
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        <span className="font-medium text-foreground">{author}</span>
      </div>
    </div>
  );
}

export default TestimonialCard;
