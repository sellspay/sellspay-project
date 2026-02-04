import { useMemo, useState } from "react";
import type { ToolData } from "@/components/tools/toolsData";
import { ToolTile } from "@/components/tools/showcase/ToolTile";

const DEFAULT_PATTERN = [
  { c: 2, r: 2 },
  { c: 1, r: 1 },
  { c: 1, r: 2 },
  { c: 1, r: 1 },
  { c: 2, r: 1 },
  { c: 1, r: 1 },
  { c: 1, r: 2 },
  { c: 1, r: 1 },
  { c: 2, r: 1 },
  { c: 1, r: 1 },
];

interface ToolBentoGridProps {
  tools: ToolData[];
  getBannerUrl: (toolId: string) => string | null;
  onSelectTool: (toolId: string) => void;
}

export function ToolBentoGrid({ tools, getBannerUrl, onSelectTool }: ToolBentoGridProps) {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  const layout = useMemo(() => {
    return tools.map((_, idx) => DEFAULT_PATTERN[idx % DEFAULT_PATTERN.length]);
  }, [tools]);

  return (
    <section aria-label="Tools" className="w-full">
      <div
        className="grid gap-2 md:gap-3"
        style={{
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gridAutoFlow: "dense",
          gridAutoRows: "minmax(150px, 1fr)",
        }}
      >
        {tools.map((tool, idx) => (
          <ToolTile
            key={tool.id}
            tool={tool}
            bannerUrl={getBannerUrl(tool.id)}
            colSpan={layout[idx].c}
            rowSpan={layout[idx].r}
            isHovered={hoveredTool === tool.id}
            onHover={() => setHoveredTool(tool.id)}
            onLeave={() => setHoveredTool(null)}
            onSelect={() => onSelectTool(tool.id)}
          />
        ))}
      </div>

      {/* Mobile: force simpler, less jumpy layout */}
      <style>{`
        @media (max-width: 640px) {
          section[aria-label="Tools"] > div {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            grid-auto-rows: minmax(140px, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}
