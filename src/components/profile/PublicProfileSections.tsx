import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionPreviewContent } from "@/components/profile-editor/previews/SectionPreviewContent";
import type { ProfileSection } from "@/components/profile-editor/types";

export function PublicProfileSections({
  profileId,
  isOwnProfile,
  refreshKey,
}: {
  profileId: string;
  isOwnProfile: boolean;
  /** Increment to force a refetch after editor save */
  refreshKey?: number;
}) {
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        let q = supabase
          .from("profile_sections")
          .select("*")
          .eq("profile_id", profileId)
          .order("display_order", { ascending: true });

        if (!isOwnProfile) q = q.eq("is_visible", true);

        const { data, error } = await q;
        if (error) throw error;
        if (!cancelled) setSections((data as unknown as ProfileSection[]) || []);
      } catch (e) {
        // fail silently on public profile
        if (!cancelled) setSections([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [profileId, isOwnProfile, refreshKey]);

  if (loading && sections.length === 0) return null;
  if (sections.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Custom Sections
      </h2>
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="bg-card/50 border border-border rounded-lg p-4">
            <SectionPreviewContent section={section} />
          </div>
        ))}
      </div>
    </section>
  );
}
