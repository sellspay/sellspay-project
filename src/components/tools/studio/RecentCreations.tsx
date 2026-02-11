import { motion } from "framer-motion";
import { ImageIcon, Music, Video, FileText } from "lucide-react";
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
    >
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {assets.map((asset) => {
          const Icon = getAssetIcon(asset.asset_type);
          return (
            <div
              key={asset.id}
              className="shrink-0 w-48 h-52 rounded-xl overflow-hidden flex flex-col hover:bg-white/[0.03] transition-colors"
            >
              {asset.asset_url && asset.asset_type?.includes("image") ? (
                <img src={asset.asset_url} alt="" className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 flex items-center justify-center bg-white/[0.02]">
                  <Icon className="h-8 w-8 text-muted-foreground/20" />
                </div>
              )}
              <div className="px-3 py-2 w-full">
                <span className="text-[10px] text-muted-foreground/50 truncate block">{asset.tool_id}</span>
                <span className="text-[9px] text-muted-foreground/30">
                  {formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
