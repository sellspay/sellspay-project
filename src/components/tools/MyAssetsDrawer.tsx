import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, Star, Image, Music, Video, FileText, File, Download, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type AssetType = "image" | "video" | "audio" | "text" | "file";

interface Asset {
  id: string;
  type: AssetType;
  storage_url: string | null;
  thumbnail_url: string | null;
  filename: string | null;
  is_favorite: boolean;
  created_at: string;
  metadata: Record<string, unknown>;
}

const TYPE_ICONS: Record<AssetType, React.ElementType> = {
  image: Image,
  video: Video,
  audio: Music,
  text: FileText,
  file: File,
};

const TYPE_FILTERS: { label: string; value: AssetType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Images", value: "image" },
  { label: "Audio", value: "audio" },
  { label: "Video", value: "video" },
  { label: "Text", value: "text" },
];

interface MyAssetsDrawerProps {
  trigger?: React.ReactNode;
}

export function MyAssetsDrawer({ trigger }: MyAssetsDrawerProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<AssetType | "all">("all");
  const [favOnly, setFavOnly] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    const fetchAssets = async () => {
      let query = supabase
        .from("tool_assets")
        .select("id, type, storage_url, thumbnail_url, filename, is_favorite, created_at, metadata")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (typeFilter !== "all") query = query.eq("type", typeFilter);
      if (favOnly) query = query.eq("is_favorite", true);

      const { data } = await query;
      setAssets((data as Asset[]) || []);
      setLoading(false);
    };
    fetchAssets();
  }, [open, user, typeFilter, favOnly]);

  const toggleFavorite = async (asset: Asset) => {
    await supabase.from("tool_assets").update({ is_favorite: !asset.is_favorite }).eq("id", asset.id);
    setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, is_favorite: !a.is_favorite } : a));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <FolderOpen className="h-3.5 w-3.5" /> My Assets
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" /> My Assets
          </SheetTitle>
        </SheetHeader>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 mt-4 mb-4">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                typeFilter === f.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={() => setFavOnly(!favOnly)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors flex items-center gap-1 ${
              favOnly
                ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            <Star className="h-3 w-3" /> Favorites
          </button>
        </div>

        {/* Assets grid */}
        <ScrollArea className="h-[calc(100vh-180px)]">
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-16">
              <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No assets yet</p>
              <p className="text-xs text-muted-foreground mt-1">Generated content will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {assets.map(asset => {
                const TypeIcon = TYPE_ICONS[asset.type] || File;
                return (
                  <div key={asset.id} className="group relative rounded-lg border border-border bg-card overflow-hidden">
                    {/* Preview */}
                    {asset.type === "image" && (asset.thumbnail_url || asset.storage_url) ? (
                      <img src={asset.thumbnail_url || asset.storage_url!} alt="" className="w-full h-24 object-cover" />
                    ) : (
                      <div className="w-full h-24 bg-muted flex items-center justify-center">
                        <TypeIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="p-2 space-y-1">
                      <p className="text-[11px] font-medium text-foreground truncate">
                        {asset.filename || `${asset.type} asset`}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[9px] px-1 py-0">{asset.type}</Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => toggleFavorite(asset)} className="p-1 rounded hover:bg-muted">
                            <Heart className={`h-3 w-3 ${asset.is_favorite ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
                          </button>
                          {asset.storage_url && (
                            <a href={asset.storage_url} download className="p-1 rounded hover:bg-muted">
                              <Download className="h-3 w-3 text-muted-foreground" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
