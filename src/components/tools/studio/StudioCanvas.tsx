import { motion } from "framer-motion";
import { CampaignCanvas } from "./CampaignCanvas";
import { ListingsCanvas } from "./ListingsCanvas";
import { SocialCanvas } from "./SocialCanvas";
import { MediaCanvas } from "./MediaCanvas";
import type { StudioSection } from "./StudioLayout";

interface StudioCanvasProps {
  activeSection: StudioSection;
  productCount: number;
  assetCount: number;
  generationCount: number;
  creditBalance: number;
  isLoadingCredits: boolean;
  recentAssets: any[];
  onLaunchPromo: () => void;
  onLaunchTool: (id: string) => void;
  onSectionChange?: (section: StudioSection) => void;
}

export function StudioCanvas(props: StudioCanvasProps) {
  const { activeSection, onLaunchTool, onLaunchPromo, onSectionChange } = props;

  const renderCanvas = () => {
    switch (activeSection) {
      case "campaign":
        return (
          <CampaignCanvas
            productCount={props.productCount}
            assetCount={props.assetCount}
            generationCount={props.generationCount}
            creditBalance={props.creditBalance}
            isLoadingCredits={props.isLoadingCredits}
            recentAssets={props.recentAssets}
            onLaunchPromo={onLaunchPromo}
            onLaunchTool={onLaunchTool}
            onSectionChange={onSectionChange}
          />
        );
      case "listings":
        return <ListingsCanvas onLaunchTool={onLaunchTool} />;
      case "social":
        return <SocialCanvas onLaunchTool={onLaunchTool} />;
      case "media":
        return <MediaCanvas onLaunchTool={onLaunchTool} />;
      default:
        return (
          <CampaignCanvas
            productCount={props.productCount}
            assetCount={props.assetCount}
            generationCount={props.generationCount}
            creditBalance={props.creditBalance}
            isLoadingCredits={props.isLoadingCredits}
            recentAssets={props.recentAssets}
            onLaunchPromo={onLaunchPromo}
            onLaunchTool={onLaunchTool}
            onSectionChange={onSectionChange}
          />
        );
    }
  };

  return (
    <div className="min-h-full">
      {renderCanvas()}
    </div>
  );
}
