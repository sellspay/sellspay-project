import { supabase } from "@/integrations/supabase/client";

interface SaveAssetOptions {
  userId: string;
  type: "image" | "audio" | "video";
  storageUrl: string;
  filename?: string;
  metadata?: Record<string, unknown>;
}

export async function saveToolAsset({ userId, type, storageUrl, filename, metadata }: SaveAssetOptions) {
  try {
    const row = {
      user_id: userId,
      type,
      storage_url: storageUrl,
      thumbnail_url: type === "image" ? storageUrl : null,
      filename: filename || `${type}-${Date.now()}`,
      metadata: metadata || null,
    };
    const { error } = await supabase.from("tool_assets").insert([row]);
    if (error) console.error("Failed to save asset:", error);
    return !error;
  } catch (e) {
    console.error("Failed to save asset:", e);
    return false;
  }
}