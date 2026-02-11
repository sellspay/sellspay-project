import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, ArrowRight, Layers, Rocket, Share2, Video, Clock } from "lucide-react";

interface CampaignStep {
  tool_id: string;
  label: string;
}

interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  steps: CampaignStep[];
  category: string;
  estimatedCredits: number;
  icon: React.ElementType;
}

const CAMPAIGNS: CampaignTemplate[] = [
  {
    id: "product-launch",
    name: "Product Launch Pack",
    description: "Complete launch kit: extract benefits, generate hooks, scripts, voiceover, captions, and export pack.",
    steps: [
      { tool_id: "product-description", label: "Extract Key Benefits" },
      { tool_id: "social-posts-pack", label: "Generate Hooks" },
      { tool_id: "short-form-script", label: "Create Scripts" },
      { tool_id: "tts-voiceover", label: "Generate Voiceover" },
      { tool_id: "caption-hashtags", label: "Captions & Hashtags" },
    ],
    category: "product_launch",
    estimatedCredits: 8,
    icon: Rocket,
  },
  {
    id: "social-content",
    name: "Social Content Pack",
    description: "Pick a product and generate 10 posts, carousel images, and a full caption pack.",
    steps: [
      { tool_id: "social-posts-pack", label: "Generate 10 Posts" },
      { tool_id: "carousel-generator", label: "Carousel Images" },
      { tool_id: "caption-hashtags", label: "Caption Pack" },
    ],
    category: "social_pack",
    estimatedCredits: 5,
    icon: Share2,
  },
  {
    id: "promo-video",
    name: "Promo Video Builder",
    description: "Combine product images with captions, voiceover, and transitions for a promo video.",
    steps: [
      { tool_id: "short-form-script", label: "Write Script" },
      { tool_id: "tts-voiceover", label: "Voiceover" },
      { tool_id: "subtitle-generator", label: "Auto Captions" },
      { tool_id: "thumbnail-generator", label: "Thumbnail" },
    ],
    category: "promo_video",
    estimatedCredits: 5,
    icon: Video,
  },
];

export function CampaignsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {CAMPAIGNS.map((campaign) => {
        const Icon = campaign.icon;
        return (
          <div
            key={campaign.id}
            className="group relative flex flex-col rounded-xl border border-border/50 bg-card overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0 border-border">
                    <Layers className="h-2.5 w-2.5" /> {campaign.steps.length} steps
                  </Badge>
                  <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0 border-amber-500/30 bg-amber-500/10 text-amber-500">
                    <Coins className="h-2.5 w-2.5" /> ~{campaign.estimatedCredits}
                  </Badge>
                </div>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">{campaign.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{campaign.description}</p>
              </div>
            </div>

            {/* Steps */}
            <div className="px-6 pb-4 flex-1">
              <div className="space-y-1.5">
                {campaign.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold shrink-0">
                      {i + 1}
                    </span>
                    {step.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 pt-0">
              <Button variant="outline" className="w-full gap-2 text-xs" disabled>
                <Clock className="h-3.5 w-3.5" /> Coming Soon
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
