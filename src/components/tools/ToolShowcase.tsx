import { useEffect, useMemo, useState } from "react";
import { toolsData, ToolData } from "./toolsData";
import { supabase } from "@/integrations/supabase/client";
import { ToolsSidebarNav } from "./ToolsSidebarNav";
import { ToolDetailView } from "./ToolDetailView";

interface ThumbnailItem {
  url: string;
  label?: string;
}

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
  // Thumbnail arrays for tool gallery
  sfx_thumbnails: ThumbnailItem[];
  vocal_thumbnails: ThumbnailItem[];
  manga_thumbnails: ThumbnailItem[];
  video_thumbnails: ThumbnailItem[];
}

interface ToolShowcaseProps {
  onSelectTool: (toolId: string) => void;
  creditBalance?: number;
  isLoadingCredits?: boolean;
}

// Map tool IDs to banner column names (only string URL fields)
type BannerUrlKeys = 'tool_sfx_banner_url' | 'tool_vocal_banner_url' | 'tool_sfx_isolator_banner_url' | 'tool_music_splitter_banner_url' | 'tool_audio_cutter_banner_url' | 'tool_audio_joiner_banner_url' | 'tool_audio_converter_banner_url' | 'tool_audio_recorder_banner_url' | 'tool_waveform_banner_url' | 'tool_video_to_audio_banner_url';

const toolBannerMap: Record<string, BannerUrlKeys> = {
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

  // Fetch banners and thumbnails from database
  useEffect(() => {
    const fetchBanners = async () => {
      const { data } = await supabase
        .from('site_content')
        .select('tool_sfx_banner_url, tool_vocal_banner_url, tool_sfx_isolator_banner_url, tool_music_splitter_banner_url, tool_audio_cutter_banner_url, tool_audio_joiner_banner_url, tool_audio_converter_banner_url, tool_audio_recorder_banner_url, tool_waveform_banner_url, tool_video_to_audio_banner_url, sfx_thumbnails, vocal_thumbnails, manga_thumbnails, video_thumbnails')
        .eq('id', 'main')
        .single();
      
      if (data) {
        setBanners({
          ...data,
          sfx_thumbnails: (data.sfx_thumbnails as unknown as ThumbnailItem[]) || [],
          vocal_thumbnails: (data.vocal_thumbnails as unknown as ThumbnailItem[]) || [],
          manga_thumbnails: (data.manga_thumbnails as unknown as ThumbnailItem[]) || [],
          video_thumbnails: (data.video_thumbnails as unknown as ThumbnailItem[]) || [],
        } as ToolBanners);
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

  // Map tool IDs to their thumbnail arrays
  const getThumbnails = (toolId: string): ThumbnailItem[] => {
    if (!banners) return [];
    // SFX Generator and Voice Isolator map to sfx/vocal thumbnails
    if (toolId === 'sfx-generator') return banners.sfx_thumbnails || [];
    if (toolId === 'voice-isolator') return banners.vocal_thumbnails || [];
    // For manga/video tools if added later
    return [];
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
          thumbnails={getThumbnails(selectedToolId)}
          onLaunch={handleLaunchTool}
        />
      </div>
    </div>
  );
}
