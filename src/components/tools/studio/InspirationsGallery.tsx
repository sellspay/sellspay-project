import { useState } from "react";
import { motion } from "framer-motion";
import { Image, Video, Play } from "lucide-react";
import { cn } from "@/lib/utils";

// Image imports
import insp1 from "@/assets/inspirations/insp-1.jpg";
import insp2 from "@/assets/inspirations/insp-2.jpg";
import insp3 from "@/assets/inspirations/insp-3.jpg";
import insp4 from "@/assets/inspirations/insp-4.jpg";
import insp5 from "@/assets/inspirations/insp-5.jpg";
import insp6 from "@/assets/inspirations/insp-6.jpg";
import insp7 from "@/assets/inspirations/insp-7.jpg";
import insp8 from "@/assets/inspirations/insp-8.jpg";
import insp9 from "@/assets/inspirations/insp-9.jpg";
import insp10 from "@/assets/inspirations/insp-10.jpg";
import insp11 from "@/assets/inspirations/insp-11.jpg";
import vid1 from "@/assets/inspirations/vid-1.jpg";
import vid2 from "@/assets/inspirations/vid-2.jpg";
import vid3 from "@/assets/inspirations/vid-3.jpg";
import vid4 from "@/assets/inspirations/vid-4.jpg";
import vid5 from "@/assets/inspirations/vid-5.jpg";
import vid6 from "@/assets/inspirations/vid-6.jpg";
import vid7 from "@/assets/inspirations/vid-7.jpg";

type Tab = "image" | "video";

interface GalleryItem {
  src: string;
  label?: string;
  /** tall = 2 rows, wide = 2 cols, default = 1x1 */
  size: "default" | "tall" | "wide";
}

const IMAGE_ITEMS: GalleryItem[] = [
  { src: insp1, label: "A surreal cinematic landscape", size: "default" },
  { src: insp11, label: "Surreal animals watching tornado near farmhouse", size: "default" },
  { src: insp3, size: "tall" },
  { src: insp4, size: "default" },
  { src: insp9, size: "tall" },
  { src: insp2, size: "default" },
  { src: insp5, size: "wide" },
  { src: insp7, size: "default" },
  { src: insp10, size: "default" },
  { src: insp6, size: "tall" },
  { src: insp8, size: "tall" },
];

const VIDEO_ITEMS: GalleryItem[] = [
  { src: vid1, size: "wide" },
  { src: vid5, size: "default" },
  { src: vid2, size: "default" },
  { src: vid3, size: "wide" },
  { src: vid6, size: "tall" },
  { src: vid4, size: "default" },
  { src: vid7, size: "default" },
  { src: insp5, size: "default" },
  { src: insp2, size: "tall" },
  { src: insp10, size: "default" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function InspirationsGallery() {
  const [tab, setTab] = useState<Tab>("image");
  const items = tab === "image" ? IMAGE_ITEMS : VIDEO_ITEMS;

  return (
    <motion.section variants={fadeUp} className="mb-14">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-white">
          Inspirations
        </h2>

        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] p-1">
          <button
            onClick={() => setTab("image")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all",
              tab === "image"
                ? "bg-white/[0.12] text-white"
                : "text-white/50 hover:text-white/70"
            )}
          >
            <Image className="h-3.5 w-3.5" />
            Image
          </button>
          <button
            onClick={() => setTab("video")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all",
              tab === "video"
                ? "bg-white/[0.12] text-white"
                : "text-white/50 hover:text-white/70"
            )}
          >
            <Video className="h-3.5 w-3.5" />
            Video
          </button>
        </div>
      </div>

      {/* Masonry grid — 5 columns */}
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 [column-fill:_balance]">
        {items.map((item, i) => (
          <motion.div
            key={`${tab}-${i}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.04 }}
            className="mb-3 break-inside-avoid"
          >
            <div className="group relative overflow-hidden rounded-[14px] bg-[#111] cursor-pointer">
              <img
                src={item.src}
                alt={item.label || "AI generated"}
                loading="lazy"
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />

              {/* Video play badge */}
              {tab === "video" && (
                <div className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/[0.12]">
                  <Play className="h-3 w-3 text-white fill-white" />
                </div>
              )}

              {/* Label overlay */}
              {item.label && (
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-[12px] text-white/90 leading-snug">{item.label}</p>
                </div>
              )}

              {/* Hover border glow */}
              <div className="absolute inset-0 rounded-[14px] border border-white/[0.04] transition-all duration-300 group-hover:border-[#3b82f6]/40 group-hover:shadow-[0_0_20px_-4px_rgba(59,130,246,0.25)]" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
