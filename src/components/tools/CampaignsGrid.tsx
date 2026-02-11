import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, ArrowRight, Layers, Rocket, Share2, Video, Play } from "lucide-react";
import { CampaignRunner } from "./CampaignRunner";
import { PromoVideoBuilder } from "./PromoVideoBuilder";

interface CampaignStep {
  tool_id: string;
  label: string;
}

interface CampaignTemplate {
  id: string;
  dbId: string;
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
    dbId: "294baf86-3de0-46a7-a33e-6ac38964da8b",
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
    dbId: "716188bb-e2a2-4f23-a934-40add3436a37",
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
    dbId: "0ac33f0e-a7fd-4c03-865f-609d3e401d28",
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

interface CampaignsGridProps {
  creditBalance?: number;
}

export function CampaignsGrid({ creditBalance = 0 }: CampaignsGridProps) {
  const [activeCampaign, setActiveCampaign] = useState<CampaignTemplate | null>(null);
  const [promoBuilderOpen, setPromoBuilderOpen] = useState(false);

  const handleLaunch = (campaign: CampaignTemplate) => {
    if (campaign.id === "promo-video") {
      setPromoBuilderOpen(true);
    } else {
      setActiveCampaign(campaign);
    }
  };
  return (
    <>
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
                <Button
                  className="w-full gap-2 text-xs"
                  onClick={() => handleLaunch(campaign)}
                >
                  <Play className="h-3.5 w-3.5" /> Launch Campaign
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Campaign Runner Dialog */}
      {activeCampaign && (
        <CampaignRunner
          open={!!activeCampaign}
          onOpenChange={(open) => {
            if (!open) setActiveCampaign(null);
          }}
          templateId={activeCampaign.dbId}
          templateName={activeCampaign.name}
          templateDescription={activeCampaign.description}
          steps={activeCampaign.steps}
          estimatedCredits={activeCampaign.estimatedCredits}
          creditBalance={creditBalance}
        />
      )}

      {/* Promo Video Builder */}
      <PromoVideoBuilder
        open={promoBuilderOpen}
        onOpenChange={setPromoBuilderOpen}
      />
    </>
  );
}
