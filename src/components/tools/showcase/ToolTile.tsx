import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ToolData } from "@/components/tools/toolsData";

interface ToolTileProps {
  tool: ToolData;
  bannerUrl: string | null;
  colSpan: number;
  rowSpan: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onSelect: () => void;
}

export function ToolTile({
  tool,
  bannerUrl,
  colSpan,
  rowSpan,
  isHovered,
  onHover,
  onLeave,
  onSelect,
}: ToolTileProps) {
  const Icon = tool.icon;
  const showDetails = colSpan >= 2 || rowSpan >= 2;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      onClick={onSelect}
      className={cn(
        "group relative overflow-hidden border border-border/40 bg-card text-left",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
      style={{
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
      }}
    >
      {/* Background */}
      <div className="absolute inset-0">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={tool.title}
            className={cn(
              "h-full w-full object-cover transition-transform duration-700",
              isHovered ? "scale-110" : "scale-100",
            )}
            loading="lazy"
          />
        ) : (
          <div className={cn("h-full w-full bg-gradient-to-br", tool.gradient)} />
        )}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            "bg-gradient-to-t from-background/95 via-background/30 to-transparent",
            isHovered ? "opacity-100" : "opacity-80",
          )}
        />
      </div>

      {/* Top badges */}
      <div className="absolute left-3 top-3 flex items-center gap-2">
        {tool.badge === "Pro" && (
          <Badge className="border-0 bg-primary text-primary-foreground">Pro</Badge>
        )}
        {tool.badge === "Free" && (
          <Badge className="border-0 bg-secondary text-secondary-foreground">Free</Badge>
        )}
      </div>

      {/* Content */}
      <div className="relative h-full w-full p-4 flex flex-col justify-end">
        <div
          className={cn(
            "transition-transform duration-500",
            isHovered ? "translate-y-0" : "translate-y-1",
          )}
        >
          <div
            className={cn(
              "mb-3 inline-flex h-10 w-10 items-center justify-center border border-border/40",
              "bg-background/10 backdrop-blur-sm",
              isHovered ? "bg-background/20" : "",
            )}
          >
            <Icon className="h-5 w-5 text-foreground" />
          </div>

          <h3
            className={cn(
              "font-semibold text-foreground",
              showDetails ? "text-2xl md:text-3xl" : "text-lg md:text-xl",
            )}
          >
            {tool.title}
          </h3>

          {showDetails && (
            <p
              className={cn(
                "mt-1 text-sm text-muted-foreground transition-opacity duration-500",
                isHovered ? "opacity-100" : "opacity-0",
              )}
            >
              {tool.tagline}
            </p>
          )}

          <div
            className={cn(
              "mt-3 flex items-center gap-2 transition-all duration-500",
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            )}
          >
            <span className="inline-flex h-9 w-9 items-center justify-center bg-primary text-primary-foreground">
              <Play className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium text-foreground">Launch</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
