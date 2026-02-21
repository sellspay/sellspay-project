import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface MediaItem {
  type: 'image' | 'video';
  src: string;
  alt?: string;
}

// Default placeholder media — replace these with real assets
const DEFAULT_MEDIA: MediaItem[] = [
  { type: 'image', src: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1200&q=80', alt: 'Creative workspace' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80', alt: 'Abstract art' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=1200&q=80', alt: 'Digital creation' },
];

const IMAGE_DURATION = 4000; // 4 seconds for images

interface AuthMediaCarouselProps {
  media?: MediaItem[];
  overlayContent?: React.ReactNode;
}

export default function AuthMediaCarousel({ media = DEFAULT_MEDIA, overlayContent }: AuthMediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const goToNext = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % media.length);
      setIsTransitioning(false);
    }, 600); // fade-out duration
  }, [media.length]);

  // Handle auto-advance for images
  useEffect(() => {
    const item = media[currentIndex];
    if (!item) return;

    if (item.type === 'image') {
      timerRef.current = setTimeout(goToNext, IMAGE_DURATION);
    }
    // Videos advance via onEnded

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, media, goToNext]);

  const handleVideoEnded = () => {
    goToNext();
  };

  // Auto-play video when it becomes current
  useEffect(() => {
    if (media[currentIndex]?.type === 'video' && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex, media]);

  const current = media[currentIndex];
  if (!current) return null;

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Media items */}
      {media.map((item, index) => (
        <div
          key={index}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{
            opacity: index === currentIndex && !isTransitioning ? 1 : 0,
            zIndex: index === currentIndex ? 1 : 0,
          }}
        >
          {item.type === 'image' ? (
            <img
              src={item.src}
              alt={item.alt || ''}
              className="w-full h-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          ) : (
            <video
              ref={index === currentIndex ? videoRef : undefined}
              src={item.src}
              className="w-full h-full object-cover"
              muted
              playsInline
              onEnded={handleVideoEnded}
            />
          )}
        </div>
      ))}

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {/* Overlay content (branding, tagline) */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end p-10 lg:p-14">
        {overlayContent || (
          <div className="max-w-md">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3 tracking-tight">
              Create. Sell. Grow.
            </h2>
            <p className="text-white/70 text-lg leading-relaxed">
              Join thousands of creators building their digital empire on SellsPay.
            </p>
          </div>
        )}

        {/* Progress dots */}
        {media.length > 1 && (
          <div className="flex gap-2 mt-6">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (timerRef.current) clearTimeout(timerRef.current);
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setCurrentIndex(index);
                    setIsTransitioning(false);
                  }, 400);
                }}
                className={`h-1 rounded-full transition-all duration-500 ${
                  index === currentIndex
                    ? 'w-8 bg-primary'
                    : 'w-4 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
