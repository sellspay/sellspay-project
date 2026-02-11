import { motion } from "framer-motion";
import { ImageIcon, Music, Video, FileText, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RecentAsset {
  id: string;
  asset_type: string;
  asset_url: string | null;
  tool_id: string;
  created_at: string;
}

interface RecentCreationsProps {
  assets: RecentAsset[];
}

function getAssetIcon(type: string) {
  if (type?.includes("image")) return ImageIcon;
  if (type?.includes("audio") || type?.includes("sfx")) return Music;
  if (type?.includes("video")) return Video;
  return FileText;
}

export function RecentCreations({ assets }: RecentCreationsProps) {
  if (!assets.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        ✨ Recent Creations
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {assets.map((asset) => {
          const Icon = getAssetIcon(asset.asset_type);
          return (
            <div
              key={asset.id}
              className="shrink-0 w-40 h-48 rounded-xl border border-border/20 bg-card/30 backdrop-blur-sm overflow-hidden flex flex-col items-center justify-center gap-2 hover:border-primary/20 transition-colors"
            >
              {asset.asset_url && asset.asset_type?.includes("image") ? (
                <img src={asset.asset_url} alt="" className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-muted/20">
                  <Icon className="h-8 w-8 text-muted-foreground/40" />
                </div>
              )}
              <div className="px-3 pb-2 w-full">
                <span className="text-[10px] text-muted-foreground truncate block">{asset.tool_id}</span>
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground/60">
                  <Clock className="h-2.5 w-2.5" />
                  {formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
