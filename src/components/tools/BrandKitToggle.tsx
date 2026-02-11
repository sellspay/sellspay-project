import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Palette, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export interface BrandKitData {
  logo_url: string | null;
  color_palette: string[];
  fonts: { heading: string; body: string };
  brand_voice: string | null;
  target_audience: string | null;
  banned_words: string[];
  product_categories: string[];
}

interface BrandKitToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onBrandKitLoaded?: (kit: BrandKitData | null) => void;
}

export function BrandKitToggle({ enabled, onToggle, onBrandKitLoaded }: BrandKitToggleProps) {
  const { user } = useAuth();
  const [hasKit, setHasKit] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("brand_kits")
      .select("logo_url, color_palette, fonts, brand_voice, target_audience, banned_words, product_categories")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setHasKit(!!data);
        if (data && enabled) {
          onBrandKitLoaded?.({
            logo_url: data.logo_url,
            color_palette: (data.color_palette as string[]) || [],
            fonts: (data.fonts as { heading: string; body: string }) || { heading: "Inter", body: "System" },
            brand_voice: data.brand_voice,
            target_audience: data.target_audience,
            banned_words: data.banned_words || [],
            product_categories: data.product_categories || [],
          });
        }
        setLoading(false);
      });
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
      <Palette className="h-4 w-4 text-primary shrink-0" />
      <Label htmlFor="brand-kit" className="text-xs font-medium text-foreground flex-1 cursor-pointer">
        Use my Brand Kit
      </Label>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : hasKit === false ? (
        <span className="text-[10px] text-muted-foreground">Not configured</span>
      ) : (
        <Switch id="brand-kit" checked={enabled} onCheckedChange={onToggle} disabled={!hasKit} />
      )}
    </div>
  );
}
