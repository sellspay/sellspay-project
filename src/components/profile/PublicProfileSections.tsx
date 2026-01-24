import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionPreviewContent } from "@/components/profile-editor/previews/SectionPreviewContent";
import CollectionRow from "@/components/profile/CollectionRow";
import type { ProfileSection } from "@/components/profile-editor/types";

interface CollectionProduct {
  id: string;
  name: string;
  cover_image_url: string | null;
  youtube_url: string | null;
  preview_video_url: string | null;
  price_cents: number | null;
  currency: string | null;
  pricing_type?: string | null;
  created_at?: string | null;
  likeCount?: number;
  commentCount?: number;
}

interface Collection {
  id: string;
  name: string;
  cover_image_url: string | null;
  display_order: number;
  is_visible: boolean;
  products: CollectionProduct[];
  totalCount: number;
}

type LayoutItem =
  | { kind: 'collection'; id: string; display_order: number; data: Collection }
  | { kind: 'section'; id: string; display_order: number; data: ProfileSection };

export function PublicProfileSections({
  profileId,
  isOwnProfile,
  refreshKey,
  recentUploadsVisible,
  recentProducts,
}: {
  profileId: string;
  isOwnProfile: boolean;
  /** Increment to force a refetch after editor save */
  refreshKey?: number;
  /** Whether to show recent uploads row (passed from profile) */
  recentUploadsVisible?: boolean;
  /** Recent products to display (passed from profile) */
  recentProducts?: CollectionProduct[];
}) {
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        // Fetch sections
        let sectionsQuery = supabase
          .from("profile_sections")
          .select("*")
          .eq("profile_id", profileId)
          .order("display_order", { ascending: true });

        if (!isOwnProfile) sectionsQuery = sectionsQuery.eq("is_visible", true);

        const { data: sectionsData, error: sectionsError } = await sectionsQuery;
        if (sectionsError) throw sectionsError;

        // Fetch collections with display_order
        let collectionsQuery = supabase
          .from("collections")
          .select("id, name, cover_image_url, is_visible, display_order")
          .eq("creator_id", profileId)
          .order("display_order", { ascending: true });

        if (!isOwnProfile) collectionsQuery = collectionsQuery.eq("is_visible", true);

        const { data: collectionsData, error: collectionsError } = await collectionsQuery;
        if (collectionsError) throw collectionsError;

        // Fetch products for each collection
        const collectionsWithProducts = await Promise.all(
          (collectionsData || []).map(async (collection) => {
            const { data: items, count } = await supabase
              .from("collection_items")
              .select("product_id", { count: "exact" })
              .eq("collection_id", collection.id)
              .order("display_order", { ascending: true });

            if (!items || items.length === 0) {
              return {
                ...collection,
                display_order: collection.display_order ?? 0,
                is_visible: collection.is_visible ?? true,
                products: [],
                totalCount: 0,
              };
            }

            const productIds = items.map((item) => item.product_id);
            const { data: productsData } = await supabase
              .from("products")
              .select("id, name, cover_image_url, youtube_url, preview_video_url, price_cents, currency, pricing_type, created_at")
              .in("id", productIds)
              .eq("status", "published");

            // Get like and comment counts
            let likeMap = new Map<string, number>();
            let commentMap = new Map<string, number>();

            if (productsData && productsData.length > 0) {
              const pIds = productsData.map(p => p.id);
              
              const { data: likeCounts } = await supabase
                .from("product_likes")
                .select("product_id")
                .in("product_id", pIds);
              
              const { data: commentCounts } = await supabase
                .from("comments")
                .select("product_id")
                .in("product_id", pIds);

              likeCounts?.forEach(like => {
                likeMap.set(like.product_id, (likeMap.get(like.product_id) || 0) + 1);
              });
              
              commentCounts?.forEach(comment => {
                commentMap.set(comment.product_id, (commentMap.get(comment.product_id) || 0) + 1);
              });
            }

            return {
              ...collection,
              display_order: collection.display_order ?? 0,
              is_visible: collection.is_visible ?? true,
              products: (productsData || []).map(p => ({
                ...p,
                likeCount: likeMap.get(p.id) || 0,
                commentCount: commentMap.get(p.id) || 0,
              })),
              totalCount: count || 0,
            };
          })
        );

        if (!cancelled) {
          setSections((sectionsData as unknown as ProfileSection[]) || []);
          setCollections(collectionsWithProducts);
        }
      } catch (e) {
        console.error("Error fetching profile layout:", e);
        if (!cancelled) {
          setSections([]);
          setCollections([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [profileId, isOwnProfile, refreshKey]);

  // Create unified layout items sorted by display_order
  const layoutItems = useMemo<LayoutItem[]>(() => {
    const collectionItems: LayoutItem[] = collections.map((c) => ({
      kind: 'collection',
      id: c.id,
      display_order: c.display_order,
      data: c,
    }));

    const sectionItems: LayoutItem[] = sections.map((s) => ({
      kind: 'section',
      id: s.id,
      display_order: s.display_order ?? 0,
      data: s,
    }));

    return [...collectionItems, ...sectionItems].sort((a, b) => {
      if (a.display_order !== b.display_order) return a.display_order - b.display_order;
      // Stable sort by id if same display_order
      return a.id.localeCompare(b.id);
    });
  }, [collections, sections]);

  if (loading && sections.length === 0 && collections.length === 0) return null;
  
  const hasContent = layoutItems.length > 0 || (recentUploadsVisible && recentProducts && recentProducts.length > 0);
  if (!hasContent) return null;

  return (
    <div className="space-y-10">
      {/* Recent Uploads - always renders first if visible */}
      {recentUploadsVisible && recentProducts && recentProducts.length > 0 && (
        <CollectionRow
          id="recent-uploads"
          name="Recent Uploads"
          coverImage={null}
          products={recentProducts.slice(0, 9)}
          totalCount={recentProducts.length}
        />
      )}

      {/* Interleaved sections and collections by display_order */}
      {layoutItems.map((item) => {
        if (item.kind === 'collection') {
          return (
            <CollectionRow
              key={`collection-${item.id}`}
              id={item.data.id}
              name={item.data.name}
              coverImage={item.data.cover_image_url}
              products={item.data.products}
              totalCount={item.data.totalCount}
            />
          );
        } else {
          const styleOpts = item.data.style_options;
          const showBg = styleOpts?.showBackground === true;
          
          // Build container styles
          const containerStyle: React.CSSProperties = {};
          if (showBg) {
            if (styleOpts?.containerBackgroundColor) {
              containerStyle.backgroundColor = styleOpts.containerBackgroundColor;
            }
            if (styleOpts?.borderColor && styleOpts?.borderStyle !== 'none') {
              containerStyle.borderColor = styleOpts.borderColor;
            }
            if (styleOpts?.borderStyle === 'dashed') {
              containerStyle.borderStyle = 'dashed';
            }
          }
          
          // Build container classes
          const containerClasses = showBg 
            ? `rounded-lg p-4 ${
                styleOpts?.borderStyle === 'none' 
                  ? '' 
                  : styleOpts?.borderStyle === 'dashed' 
                    ? 'border border-dashed' 
                    : 'border'
              } ${
                !styleOpts?.containerBackgroundColor ? 'bg-card/50' : ''
              } ${
                !styleOpts?.borderColor && styleOpts?.borderStyle !== 'none' ? 'border-border' : ''
              }`
            : '';
          
          return (
            <div 
              key={`section-${item.id}`} 
              className={containerClasses}
              style={containerStyle}
            >
              <SectionPreviewContent section={item.data} />
            </div>
          );
        }
      })}
    </div>
  );
}
