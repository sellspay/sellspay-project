import { Button } from "@/components/ui/button";
import { Download, Image, LayoutTemplate, GalleryHorizontal, RefreshCw, Share2 } from "lucide-react";

interface AssetOutputPanelProps {
  assetType: "image" | "audio" | "video" | "text" | "file";
  storageUrl?: string;
  filename?: string;
  onSetAsThumbnail?: () => void;
  onAddToGallery?: () => void;
  onAddToHero?: () => void;
  onGenerateMore?: () => void;
  onGenerateSocialPosts?: () => void;
}

export function AssetOutputPanel({
  assetType,
  storageUrl,
  filename,
  onSetAsThumbnail,
  onAddToGallery,
  onAddToHero,
  onGenerateMore,
  onGenerateSocialPosts,
}: AssetOutputPanelProps) {
  const handleDownload = () => {
    if (!storageUrl) return;
    const a = document.createElement("a");
    a.href = storageUrl;
    a.download = filename || "asset";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</h4>
      <div className="flex flex-wrap gap-2">
        {storageUrl && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
        )}
        {(assetType === "image" || assetType === "video") && onSetAsThumbnail && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onSetAsThumbnail}>
            <Image className="h-3.5 w-3.5" /> Set as Thumbnail
          </Button>
        )}
        {(assetType === "image" || assetType === "video") && onAddToGallery && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onAddToGallery}>
            <GalleryHorizontal className="h-3.5 w-3.5" /> Add to Gallery
          </Button>
        )}
        {onAddToHero && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onAddToHero}>
            <LayoutTemplate className="h-3.5 w-3.5" /> Add to Hero
          </Button>
        )}
        {onGenerateMore && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onGenerateMore}>
            <RefreshCw className="h-3.5 w-3.5" /> Generate More
          </Button>
        )}
        {onGenerateSocialPosts && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onGenerateSocialPosts}>
            <Share2 className="h-3.5 w-3.5" /> Social Posts from This
          </Button>
        )}
      </div>
    </div>
  );
}
