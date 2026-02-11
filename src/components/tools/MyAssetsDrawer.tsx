import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  FolderOpen, Star, Image, Music, Video, FileText, File, Download,
  Heart, Search, Trash2, CheckSquare, Square, Link2, X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

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
  product_id?: string | null;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    const fetchAssets = async () => {
      let query = supabase
        .from("tool_assets")
        .select("id, type, storage_url, thumbnail_url, filename, is_favorite, created_at, metadata, product_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (typeFilter !== "all") query = query.eq("type", typeFilter);
      if (favOnly) query = query.eq("is_favorite", true);

      const { data } = await query;
      setAssets((data as Asset[]) || []);
      setLoading(false);
    };
    fetchAssets();
  }, [open, user, typeFilter, favOnly]);

  const filteredAssets = searchQuery.trim()
    ? assets.filter(a => (a.filename || "").toLowerCase().includes(searchQuery.toLowerCase()))
    : assets;

  const toggleFavorite = async (asset: Asset) => {
    await supabase.from("tool_assets").update({ is_favorite: !asset.is_favorite }).eq("id", asset.id);
    setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, is_favorite: !a.is_favorite } : a));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredAssets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAssets.map(a => a.id)));
    }
  };

  const bulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("tool_assets").delete().in("id", ids);
    if (error) {
      toast.error("Failed to delete assets");
    } else {
      setAssets(prev => prev.filter(a => !selectedIds.has(a.id)));
      setSelectedIds(new Set());
      toast.success(`${ids.length} asset(s) deleted`);
    }
  }, [selectedIds]);

  const bulkFavorite = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    await supabase.from("tool_assets").update({ is_favorite: true }).in("id", ids);
    setAssets(prev => prev.map(a => selectedIds.has(a.id) ? { ...a, is_favorite: true } : a));
    toast.success(`${ids.length} asset(s) favorited`);
  }, [selectedIds]);

  const exitBulkMode = () => {
    setBulkMode(false);
    setSelectedIds(new Set());
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) exitBulkMode(); }}>
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
            <Badge variant="outline" className="text-[10px] ml-auto">{assets.length}</Badge>
          </SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="relative mt-3 mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 mb-3">
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

        {/* Bulk mode toolbar */}
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant={bulkMode ? "default" : "outline"}
            size="sm"
            className="text-[11px] h-7 gap-1"
            onClick={() => bulkMode ? exitBulkMode() : setBulkMode(true)}
          >
            {bulkMode ? <X className="h-3 w-3" /> : <CheckSquare className="h-3 w-3" />}
            {bulkMode ? "Cancel" : "Select"}
          </Button>
          {bulkMode && (
            <>
              <Button variant="outline" size="sm" className="text-[11px] h-7" onClick={selectAll}>
                {selectedIds.size === filteredAssets.length ? "Deselect All" : "Select All"}
              </Button>
              <Button variant="outline" size="sm" className="text-[11px] h-7 gap-1" onClick={bulkFavorite} disabled={selectedIds.size === 0}>
                <Heart className="h-3 w-3" /> Fav ({selectedIds.size})
              </Button>
              <Button variant="destructive" size="sm" className="text-[11px] h-7 gap-1" onClick={bulkDelete} disabled={selectedIds.size === 0}>
                <Trash2 className="h-3 w-3" /> Delete ({selectedIds.size})
              </Button>
            </>
          )}
        </div>

        {/* Assets grid */}
        <ScrollArea className="h-[calc(100vh-280px)]">
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-16">
              <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No matching assets" : "No assets yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Generated content will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredAssets.map(asset => {
                const TypeIcon = TYPE_ICONS[asset.type] || File;
                const isSelected = selectedIds.has(asset.id);
                return (
                  <div
                    key={asset.id}
                    className={`group relative rounded-lg border bg-card overflow-hidden transition-colors ${
                      isSelected ? "border-primary ring-1 ring-primary" : "border-border"
                    }`}
                    onClick={bulkMode ? () => toggleSelect(asset.id) : undefined}
                  >
                    {/* Bulk select checkbox */}
                    {bulkMode && (
                      <div className="absolute top-2 left-2 z-10">
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    )}

                    {/* Preview */}
                    {asset.type === "image" && (asset.thumbnail_url || asset.storage_url) ? (
                      <img src={asset.thumbnail_url || asset.storage_url!} alt="" className="w-full h-24 object-cover" />
                    ) : (
                      <div className="w-full h-24 bg-muted flex items-center justify-center">
                        <TypeIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}

                    {/* Product link badge */}
                    {asset.product_id && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center" title="Linked to product">
                          <Link2 className="h-2.5 w-2.5 text-primary" />
                        </div>
                      </div>
                    )}

                    {/* Info */}
                    <div className="p-2 space-y-1">
                      <p className="text-[11px] font-medium text-foreground truncate">
                        {asset.filename || `${asset.type} asset`}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[9px] px-1 py-0">{asset.type}</Badge>
                        {!bulkMode && (
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
                        )}
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
