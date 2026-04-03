import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MediaItem {
  type: 'image' | 'video';
  src: string;
  alt?: string;
}

const DEFAULT_MEDIA: MediaItem[] = [
  { type: 'video', src: 'https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4', alt: 'Creative studio' },
];

const IMAGE_DURATION = 5000;

interface AuthMediaCarouselProps {
  media?: MediaItem[];
  overlayContent?: React.ReactNode;
}

export default function AuthMediaCarousel({ media = DEFAULT_MEDIA, overlayContent }: AuthMediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  }, [media.length]);

  useEffect(() => {
    const item = media[currentIndex];
    if (!item) return;

    if (item.type === 'image') {
      timerRef.current = setTimeout(goToNext, IMAGE_DURATION);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, media, goToNext]);

  const handleVideoEnded = () => goToNext();

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
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {current.type === 'image' ? (
            <img
              src={current.src}
              alt={current.alt || ''}
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              src={current.src}
              className="w-full h-full object-cover"
              muted
              playsInline
              onEnded={handleVideoEnded}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlays */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

      {/* Bottom-left branding */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end p-10 lg:p-14">
        {overlayContent || (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="max-w-lg"
          >
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-4 tracking-tight leading-[1.1]">
              <span className="bg-gradient-to-r from-white via-blue-200 to-cyan-300 bg-clip-text text-transparent">
                Create. Sell. Grow.
              </span>
            </h2>
            <p className="text-white/60 text-base lg:text-lg leading-relaxed font-light tracking-wide">
              Join thousands of creators building their digital empire on SellsPay.
            </p>
          </motion.div>
        )}

        {/* Progress dots */}
        <div className="flex gap-2 mt-8">
          {media.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className="relative h-1 rounded-full overflow-hidden transition-all duration-300"
              style={{ width: i === currentIndex ? 40 : 16 }}
            >
              <div className="absolute inset-0 bg-white/20 rounded-full" />
              {i === currentIndex && (
                <motion.div
                  className="absolute inset-0 bg-white rounded-full origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: current.type === 'video' ? 10 : IMAGE_DURATION / 1000,
                    ease: 'linear',
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
