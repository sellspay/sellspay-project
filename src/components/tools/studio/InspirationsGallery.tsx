import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Video, Play, X, Sparkles, ArrowRight, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
import insp12 from "@/assets/inspirations/insp-12.jpg";
import insp13 from "@/assets/inspirations/insp-13.jpg";
import insp14 from "@/assets/inspirations/insp-14.jpg";
import insp15 from "@/assets/inspirations/insp-15.jpg";
import insp16 from "@/assets/inspirations/insp-16.jpg";
import insp17 from "@/assets/inspirations/insp-17.jpg";
import insp18 from "@/assets/inspirations/insp-18.jpg";
import insp19 from "@/assets/inspirations/insp-19.jpg";
import insp20 from "@/assets/inspirations/insp-20.jpg";
import insp21 from "@/assets/inspirations/insp-21.jpg";
import vid1Thumb from "@/assets/inspirations/vid-1.jpg";
import vid2Thumb from "@/assets/inspirations/vid-2.jpg";
import vid3Thumb from "@/assets/inspirations/vid-3.jpg";
import vid4Thumb from "@/assets/inspirations/vid-4.jpg";
import vid5Thumb from "@/assets/inspirations/vid-5.jpg";
import vid6Thumb from "@/assets/inspirations/vid-6.jpg";
import vid7Thumb from "@/assets/inspirations/vid-7.jpg";
import vid8Thumb from "@/assets/inspirations/vid-8.jpg";
import vid9Thumb from "@/assets/inspirations/vid-9.jpg";
import vid10Thumb from "@/assets/inspirations/vid-10.jpg";
import vid11Thumb from "@/assets/inspirations/vid-11.jpg";
import vid12Thumb from "@/assets/inspirations/vid-12.jpg";
import vid13Thumb from "@/assets/inspirations/vid-13.jpg";
import vid14Thumb from "@/assets/inspirations/vid-14.jpg";
import vid15Thumb from "@/assets/inspirations/vid-15.jpg";
import vid16Thumb from "@/assets/inspirations/vid-16.jpg";
import vid17Thumb from "@/assets/inspirations/vid-17.jpg";

// Video asset imports
import vid1Video from "@/assets/inspirations/vid-1.mp4.asset.json";
import vid2Video from "@/assets/inspirations/vid-2.mp4.asset.json";
import vid3Video from "@/assets/inspirations/vid-3.mp4.asset.json";
import vid4Video from "@/assets/inspirations/vid-4.mp4.asset.json";
import vid5Video from "@/assets/inspirations/vid-5.mp4.asset.json";
import vid6Video from "@/assets/inspirations/vid-6.mp4.asset.json";
import vid7Video from "@/assets/inspirations/vid-7.mp4.asset.json";
import vid8Video from "@/assets/inspirations/vid-8.mp4.asset.json";
import vid9Video from "@/assets/inspirations/vid-9.mp4.asset.json";
import vid10Video from "@/assets/inspirations/vid-10.mp4.asset.json";
import vid11Video from "@/assets/inspirations/vid-11.mp4.asset.json";
import vid12Video from "@/assets/inspirations/vid-12.mp4.asset.json";
import vid13Video from "@/assets/inspirations/vid-13.mp4.asset.json";
import vid14Video from "@/assets/inspirations/vid-14.mp4.asset.json";
import vid15Video from "@/assets/inspirations/vid-15.mp4.asset.json";
import vid16Video from "@/assets/inspirations/vid-16.mp4.asset.json";
import vid17Video from "@/assets/inspirations/vid-17.mp4.asset.json";

type Tab = "image" | "video";

interface GalleryItem {
  src: string;
  videoUrl?: string;
  label: string;
  prompt: string;
  toolId: string;
}

const IMAGE_ITEMS: GalleryItem[] = [
  { src: insp1, label: "Surreal cinematic landscape", prompt: "A surreal cinematic landscape, a woman in a white dress standing in a vast field of white daisies looking up at a massive UFO hovering in a golden sunset sky, photorealistic, dramatic lighting, cinematic composition", toolId: "image-generator" },
  { src: insp11, label: "Dog with a burger", prompt: "A dog with a burger in its mouth sitting in a sunny garden, funny pet photography, shallow depth of field, warm golden lighting, viral social media photo", toolId: "image-generator" },
  { src: insp3, label: "NYC street fashion", prompt: "Street fashion photography, two stylish people crossing a New York City crosswalk wearing matching retro outfits, motion blur pedestrians, golden hour lighting, editorial fashion shot", toolId: "image-generator" },
  { src: insp12, label: "Samurai at dawn", prompt: "A samurai standing on a misty mountain peak at dawn, cherry blossom petals floating in the wind, epic cinematic Japanese landscape, dramatic lighting", toolId: "image-generator" },
  { src: insp4, label: "Fashion portrait", prompt: "A close-up portrait of a young woman wearing black sunglasses against a vivid green background, eating street food, editorial fashion photography, rich colors, sharp detail", toolId: "image-generator" },
  { src: insp9, label: "Parisian street style", prompt: "Stylish woman in a black fur coat walking down a Parisian street next to a yellow post, high fashion editorial photography, moody overcast lighting, film grain", toolId: "image-generator" },
  { src: insp2, label: "Cyberpunk warrior", prompt: "A cyberpunk woman with glowing blue cybernetic arm standing in rain, neon city lights reflecting on wet streets, moody atmospheric lighting, cinematic photography style", toolId: "image-generator" },
  { src: insp14, label: "Autumn aerial", prompt: "Aerial drone shot of a winding road through autumn forest, vibrant orange red and yellow foliage, golden hour, landscape photography masterpiece", toolId: "image-generator" },
  { src: insp5, label: "Fire dragon", prompt: "Dark fantasy dragon breathing fire over a volcanic landscape with lava rivers, epic cinematic scene, dramatic red and orange lighting, hyper detailed digital art", toolId: "image-generator" },
  { src: insp13, label: "Luxury product shot", prompt: "Luxury perfume bottle floating in golden liquid splash, high-end product photography, black background, dramatic studio lighting, commercial advertisement", toolId: "image-generator" },
  { src: insp7, label: "Tropical paradise", prompt: "POV looking down from a wooden sailboat into crystal clear turquoise tropical water, feet dangling over the edge, adventure travel photography, bright sunny day", toolId: "image-generator" },
  { src: insp15, label: "Synthwave city", prompt: "Retro 80s synthwave city skyline at night, neon pink and purple lights, chrome sports car on empty highway, vaporwave aesthetic, digital art", toolId: "image-generator" },
  { src: insp10, label: "Alien crystals", prompt: "Beautiful purple amethyst crystals growing on an alien moonscape, space background with stars, photorealistic macro photography, dramatic lighting", toolId: "image-generator" },
  { src: insp16, label: "Majestic whale", prompt: "Underwater photography of a majestic humpback whale swimming through sunbeams in deep blue ocean, ethereal light rays, National Geographic style", toolId: "image-generator" },
  { src: insp6, label: "Industrial harbor", prompt: "A massive cargo ship in a rainy harbor at night, moody atmospheric industrial scene, wet reflections, foggy, cinematic blue teal color grading, photorealistic", toolId: "image-generator" },
  { src: insp17, label: "Victorian mansion", prompt: "Abandoned Victorian mansion overgrown with flowers and ivy, magical realism, warm sunset light filtering through broken windows, dreamlike atmosphere", toolId: "image-generator" },
  { src: insp8, label: "Anime warrior", prompt: "Anime style illustration of a female warrior in black leather with katana, dynamic action pose, splattered ink effect, manga inspired, high contrast black and white with red accents", toolId: "image-generator" },
  { src: insp18, label: "Rainbow chameleon", prompt: "Macro photography of a colorful chameleon on a branch, iridescent scales reflecting rainbow colors, shallow depth of field, studio quality", toolId: "image-generator" },
  { src: insp19, label: "Cyberpunk Tokyo", prompt: "Futuristic Tokyo street at night with holographic billboards and flying cars, cyberpunk 2077 style, rain puddles reflecting neon lights, ultra detailed", toolId: "image-generator" },
  { src: insp20, label: "Ballet spotlight", prompt: "Elegant ballerina mid-leap in an empty grand theater, dramatic spotlight, motion blur on tutu, fine art photography, black and white with gold accents", toolId: "image-generator" },
  { src: insp21, label: "Enchanted forest", prompt: "Giant ancient tree in a bioluminescent forest at night, glowing mushrooms and fireflies, fantasy world, magical atmosphere, concept art", toolId: "image-generator" },
];

const VIDEO_ITEMS: GalleryItem[] = [
  { src: vid1Thumb, videoUrl: vid1Video.url, label: "Space battle cockpit", prompt: "A cinematic scene of a futuristic spaceship cockpit with a pilot looking out at a nebula, sci-fi movie still, dramatic lighting, widescreen anamorphic look", toolId: "text-to-video" },
  { src: vid8Thumb, videoUrl: vid8Video.url, label: "Bioluminescent whale", prompt: "A massive bioluminescent whale breaching from dark ocean at night near an industrial shipyard, neon teal veins glowing, cinematic VFX shot, rain and lightning", toolId: "text-to-video" },
  { src: vid2Thumb, videoUrl: vid2Video.url, label: "Robot encounter", prompt: "Action movie scene, group of people standing in a futuristic white room with a small pink robot, cinematic wide shot, sci-fi thriller atmosphere", toolId: "text-to-video" },
  { src: vid9Thumb, videoUrl: vid9Video.url, label: "Night car chase", prompt: "Fast-paced car chase through narrow European streets at night, sparks flying, motion blur, adrenaline action movie still, widescreen cinematic", toolId: "text-to-video" },
  { src: vid3Thumb, videoUrl: vid3Video.url, label: "Arctic expedition", prompt: "Snowy mountain landscape with a lone figure running through deep snow, avalanche in background, cinematic action shot, dramatic scale, epic movie scene", toolId: "text-to-video" },
  { src: vid10Thumb, videoUrl: vid10Video.url, label: "Astronaut in space", prompt: "Astronaut floating in space with Earth reflected in helmet visor, stars and nebula behind, ultra realistic, IMAX movie still quality", toolId: "text-to-video" },
  { src: vid4Thumb, videoUrl: vid4Video.url, label: "Cyberpunk transit", prompt: "Neon-lit cyberpunk bus driving through a rainy night city, reflections on wet asphalt, dystopian atmosphere, cinematic color grading, movie still", toolId: "text-to-video" },
  { src: vid11Thumb, videoUrl: vid11Video.url, label: "Gladiator arena", prompt: "Ancient Roman gladiator arena with thousands of spectators, dramatic overhead view, dust and sand, epic historical movie scene, golden hour lighting", toolId: "text-to-video" },
  { src: vid5Thumb, videoUrl: vid5Video.url, label: "Retro phone booth", prompt: "Close up of a retro neon phone booth at night with people inside, 80s vibe, rain, colorful reflections, cinematic street photography", toolId: "text-to-video" },
  { src: vid12Thumb, videoUrl: vid12Video.url, label: "Haute couture runway", prompt: "Luxury fashion runway show with dramatic spotlights, model walking in avant-garde haute couture, smoke machine, dark elegant atmosphere, fashion week", toolId: "text-to-video" },
  { src: vid13Thumb, videoUrl: vid13Video.url, label: "Wolf under aurora", prompt: "A wolf howling on a cliff edge under northern lights aurora borealis, snow falling, dramatic wildlife cinematography, epic nature documentary", toolId: "text-to-video" },
  { src: vid14Thumb, videoUrl: vid14Video.url, label: "Medieval siege", prompt: "Massive medieval castle siege with catapults firing and fire arrows in the night sky, epic battle scene, Lord of the Rings style cinematography", toolId: "text-to-video" },
  { src: vid6Thumb, videoUrl: vid6Video.url, label: "Floating tech", prompt: "Sleek white laptop floating in a minimalist white void with dramatic shadow, product photography, ultra clean, futuristic tech shot", toolId: "text-to-video" },
  { src: vid15Thumb, videoUrl: vid15Video.url, label: "Underwater ruins", prompt: "Underwater city ruins with ancient Greek columns covered in coral and schools of colorful fish, volumetric light rays, cinematic deep sea exploration", toolId: "text-to-video" },
  { src: vid7Thumb, videoUrl: vid7Video.url, label: "Glamorous event", prompt: "Two elegant women at a glamorous event in pink tulle dresses, luxury hotel lobby, golden lighting, editorial fashion photography", toolId: "text-to-video" },
  { src: vid16Thumb, videoUrl: vid16Video.url, label: "Michelin star plating", prompt: "Professional chef plating an exquisite dish with tweezers, steam rising, close-up food photography, Michelin star kitchen, dramatic lighting", toolId: "text-to-video" },
  { src: vid17Thumb, videoUrl: vid17Video.url, label: "Shibuya crossing", prompt: "Time-lapse style photo of a bustling Tokyo Shibuya crossing at night, thousands of people with motion trails, long exposure, city energy, cinematic", toolId: "text-to-video" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ── Video Card with hover-to-play ── */
function VideoCard({
  item,
  onSelect,
}: {
  item: GalleryItem;
  onSelect: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (videoRef.current && item.videoUrl) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [item.videoUrl]);

  const handleMouseLeave = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative overflow-hidden rounded-[14px] bg-[#111] cursor-pointer w-full text-left"
    >
      {/* Thumbnail */}
      <img
        src={item.src}
        alt={item.label}
        loading="lazy"
        className={cn(
          "w-full h-auto object-cover transition-all duration-500",
          isPlaying ? "opacity-0" : "opacity-100 group-hover:scale-[1.04]"
        )}
      />

      {/* Video overlay */}
      {item.videoUrl && (
        <video
          ref={videoRef}
          src={item.videoUrl}
          muted
          loop
          playsInline
          preload="none"
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            isPlaying ? "opacity-100" : "opacity-0"
          )}
        />
      )}

      {/* Play badge */}
      <div
        className={cn(
          "absolute top-3 right-3 h-7 w-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/[0.12] transition-opacity duration-300",
          isPlaying ? "opacity-0" : "opacity-100"
        )}
      >
        <Play className="h-3 w-3 text-white fill-white" />
      </div>

      {/* Bottom label */}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <p className="text-[11px] text-white/80 font-medium leading-snug">{item.label}</p>
      </div>

      {/* Hover border glow */}
      <div className="absolute inset-0 rounded-[14px] border border-white/[0.04] transition-all duration-300 group-hover:border-[#3b82f6]/40 group-hover:shadow-[0_0_20px_-4px_rgba(59,130,246,0.25)]" />
    </button>
  );
}

/* ── Preview Modal ── */
function PreviewModal({
  item,
  tab,
  onClose,
  onUse,
}: {
  item: GalleryItem;
  tab: Tab;
  onClose: () => void;
  onUse: () => void;
}) {
  const handleCopy = () => {
    navigator.clipboard.writeText(item.prompt);
    toast.success("Prompt copied to clipboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[680px] max-h-[90vh] overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#0c0c0f] shadow-2xl flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/[0.1] text-white/60 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Media */}
        <div className="relative flex-shrink-0">
          {tab === "video" && item.videoUrl ? (
            <video
              src={item.videoUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full max-h-[400px] object-cover"
            />
          ) : (
            <img src={item.src} alt={item.label} className="w-full max-h-[400px] object-cover" />
          )}
          {tab === "video" && !item.videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-14 w-14 rounded-full bg-black/50 backdrop-blur-sm border border-white/[0.15] flex items-center justify-center">
                <Play className="h-6 w-6 text-white fill-white ml-0.5" />
              </div>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0c0c0f] to-transparent" />
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/60">
              {tab === "image" ? "Image" : "Video"} Prompt
            </span>
            <h3 className="text-lg font-bold text-white mt-1">{item.label}</h3>
          </div>

          <div className="relative rounded-xl bg-white/[0.04] border border-white/[0.06] p-4">
            <p className="text-[13px] text-white/70 leading-relaxed pr-8">{item.prompt}</p>
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
              title="Copy prompt"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={onUse}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary to-blue-600 hover:brightness-110 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Use This Prompt
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Gallery ── */
export function InspirationsGallery() {
  const [tab, setTab] = useState<Tab>("image");
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const navigate = useNavigate();
  const items = tab === "image" ? IMAGE_ITEMS : VIDEO_ITEMS;

  const handleUse = (item: GalleryItem) => {
    setSelected(null);
    navigate(`/studio/${item.toolId}`, {
      replace: true,
      state: { prefillPrompt: item.prompt },
    });
  };

  return (
    <motion.section variants={fadeUp} className="mb-14">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-white">
          Inspirations
        </h2>
        <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] p-1">
          <button
            onClick={() => setTab("image")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all",
              tab === "image" ? "bg-white/[0.12] text-white" : "text-white/50 hover:text-white/70"
            )}
          >
            <Image className="h-3.5 w-3.5" /> Image
          </button>
          <button
            onClick={() => setTab("video")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all",
              tab === "video" ? "bg-white/[0.12] text-white" : "text-white/50 hover:text-white/70"
            )}
          >
            <Video className="h-3.5 w-3.5" /> Video
          </button>
        </div>
      </div>

      {/* Masonry grid */}
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 [column-fill:_balance]">
        {items.map((item, i) => (
          <motion.div
            key={`${tab}-${i}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.5) }}
            className="mb-3 break-inside-avoid"
          >
            {tab === "video" ? (
              <VideoCard item={item} onSelect={() => setSelected(item)} />
            ) : (
              <button
                onClick={() => setSelected(item)}
                className="group relative overflow-hidden rounded-[14px] bg-[#111] cursor-pointer w-full text-left"
              >
                <img
                  src={item.src}
                  alt={item.label}
                  loading="lazy"
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <p className="text-[11px] text-white/80 font-medium leading-snug">{item.label}</p>
                </div>
                <div className="absolute inset-0 rounded-[14px] border border-white/[0.04] transition-all duration-300 group-hover:border-[#3b82f6]/40 group-hover:shadow-[0_0_20px_-4px_rgba(59,130,246,0.25)]" />
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Preview modal */}
      <AnimatePresence>
        {selected && (
          <PreviewModal
            item={selected}
            tab={tab}
            onClose={() => setSelected(null)}
            onUse={() => handleUse(selected)}
          />
        )}
      </AnimatePresence>
    </motion.section>
  );
}
