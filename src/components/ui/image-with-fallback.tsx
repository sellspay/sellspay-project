import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageWithFallbackProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

// Check if URL is a video file
const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.ogg'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

export function ImageWithFallback({ 
  src, 
  alt, 
  className,
  fallbackClassName 
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  // If error or no src, show a gradient pattern
  if (error || !src) {
    return (
      <div className={cn(
        "relative w-full h-full bg-gradient-to-br from-primary/20 via-violet-500/20 to-fuchsia-500/20",
        fallbackClassName
      )}>
        {/* Abstract pattern overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-primary/30 rounded-full blur-2xl" />
          <div className="absolute bottom-1/4 right-1/4 w-1/3 h-1/3 bg-violet-500/30 rounded-full blur-xl" />
        </div>
        
        {/* Fallback Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageOff className="w-6 h-6 text-muted-foreground/40" />
        </div>
      </div>
    );
  }

  // Handle video banners
  if (isVideoUrl(src)) {
    return (
      <video
        src={src}
        className={className}
        onError={() => setError(true)}
        autoPlay
        loop
        muted
        playsInline
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}
