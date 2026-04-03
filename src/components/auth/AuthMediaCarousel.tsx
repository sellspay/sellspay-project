import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AuthMediaCarousel() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        src="https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4"
        className="w-full h-full object-cover"
        muted
        playsInline
        loop
        autoPlay
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/50 via-black/15 to-transparent" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-black/10" />

      {/* Bottom-left branding */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-10 lg:p-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-lg"
        >
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.15] mb-3">
            <span className="text-primary">Create stunning content </span>
            <span className="text-white">with unlimited possibilities</span>
          </h2>
          <p className="text-white/50 text-sm lg:text-base leading-relaxed font-normal">
            Craft digital products, sell globally, and grow your audience. From beginners to pros, we empower your creativity.
          </p>
        </motion.div>

        {/* Progress bar */}
        <div className="flex gap-2 mt-6">
          <div className="h-[3px] w-10 rounded-full bg-white/80" />
          <div className="h-[3px] w-4 rounded-full bg-white/20" />
          <div className="h-[3px] w-4 rounded-full bg-white/20" />
          <div className="h-[3px] w-4 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}
