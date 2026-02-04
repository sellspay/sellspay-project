import { useEffect, useMemo, useState } from "react";
import { toolsData, ToolData } from "./toolsData";
import { supabase } from "@/integrations/supabase/client";
import { ToolsSidebarNav } from "./ToolsSidebarNav";
import { ToolDetailView } from "./ToolDetailView";

interface ToolBanners {
  tool_sfx_banner_url: string | null;
  tool_vocal_banner_url: string | null;
  tool_sfx_isolator_banner_url: string | null;
  tool_music_splitter_banner_url: string | null;
  tool_audio_cutter_banner_url: string | null;
  tool_audio_joiner_banner_url: string | null;
  tool_audio_converter_banner_url: string | null;
  tool_audio_recorder_banner_url: string | null;
  tool_waveform_banner_url: string | null;
  tool_video_to_audio_banner_url: string | null;
}

interface ToolShowcaseProps {
  onSelectTool: (toolId: string) => void;
  creditBalance?: number;
  isLoadingCredits?: boolean;
}

// Map tool IDs to banner column names
const toolBannerMap: Record<string, keyof ToolBanners> = {
  'sfx-generator': 'tool_sfx_banner_url',
  'voice-isolator': 'tool_vocal_banner_url',
  'sfx-isolator': 'tool_sfx_isolator_banner_url',
  'music-splitter': 'tool_music_splitter_banner_url',
  'audio-cutter': 'tool_audio_cutter_banner_url',
  'audio-joiner': 'tool_audio_joiner_banner_url',
  'audio-converter': 'tool_audio_converter_banner_url',
  'audio-recorder': 'tool_audio_recorder_banner_url',
  'waveform-generator': 'tool_waveform_banner_url',
  'video-to-audio': 'tool_video_to_audio_banner_url',
};

export function ToolShowcase({ 
  onSelectTool, 
  creditBalance = 0,
  isLoadingCredits 
}: ToolShowcaseProps) {
  const [banners, setBanners] = useState<ToolBanners | null>(null);
  const [selectedToolId, setSelectedToolId] = useState<string>("sfx-generator");

  // Fetch banners from database
  useEffect(() => {
    const fetchBanners = async () => {
      const { data } = await supabase
        .from('site_content')
        .select('tool_sfx_banner_url, tool_vocal_banner_url, tool_sfx_isolator_banner_url, tool_music_splitter_banner_url, tool_audio_cutter_banner_url, tool_audio_joiner_banner_url, tool_audio_converter_banner_url, tool_audio_recorder_banner_url, tool_waveform_banner_url, tool_video_to_audio_banner_url')
        .eq('id', 'main')
        .single();
      
      if (data) {
        setBanners(data as ToolBanners);
      }
    };
    fetchBanners();
  }, []);

  const selectedTool = useMemo(() => {
    return toolsData.find(t => t.id === selectedToolId) || toolsData[0];
  }, [selectedToolId]);

  const getBannerUrl = (toolId: string): string | null => {
    if (!banners) return null;
    const key = toolBannerMap[toolId];
    return key ? banners[key] : null;
  };

  const handleSelectToolInSidebar = (toolId: string) => {
    setSelectedToolId(toolId);
  };

  const handleLaunchTool = () => {
    onSelectTool(selectedToolId);
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar (fixed) */}
      <ToolsSidebarNav
        selectedToolId={selectedToolId}
        onSelectTool={handleSelectToolInSidebar}
      />

      {/* Main Content (only this column scrolls) */}
      <div className="flex-1 overflow-y-auto">
        <ToolDetailView
          tool={selectedTool}
          bannerUrl={getBannerUrl(selectedToolId)}
          onLaunch={handleLaunchTool}
        />
      </div>
    </div>
  );
}
