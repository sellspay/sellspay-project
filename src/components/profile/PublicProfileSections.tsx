import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionPreviewContent } from "@/components/profile-editor/previews/SectionPreviewContent";
import CollectionRow from "@/components/profile/CollectionRow";
import { AnimatedSection } from "@/components/profile/AnimatedSection";
import type { ProfileSection, FontOption, CustomFont, AnimationType } from "@/components/profile-editor/types";
import { getFontClassName, getCustomFontStyle, useCustomFont } from "@/components/profile-editor/hooks/useCustomFont";
import { cn } from "@/lib/utils";

interface CollectionProduct {
  id: string;
  name: string;
  cover_image_url: string | null;
  youtube_url: string | null;
  preview_video_url: string | null;
  price_cents: number | null;
  currency: string | null;
  pricing_type?: string | null;
  subscription_access?: string | null;
  included_in_subscription?: boolean | null;
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
  style_options?: { animation?: AnimationType };
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
  globalFont,
  globalCustomFont,
}: {
  profileId: string;
  isOwnProfile: boolean;
  /** Increment to force a refetch after editor save */
  refreshKey?: number;
  /** Whether to show recent uploads row (passed from profile) */
  recentUploadsVisible?: boolean;
  /** Recent products to display (passed from profile) */
  recentProducts?: CollectionProduct[];
  /** Global font setting for the profile */
  globalFont?: string | null;
  /** Global custom font for the profile */
  globalCustomFont?: { name: string; url: string } | null;
}) {
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Apply global custom font
  useCustomFont(globalCustomFont ? { name: globalCustomFont.name, url: globalCustomFont.url } : undefined);
  
  // Get global font classes and styles
  const globalFontClass = getFontClassName(globalFont as FontOption);
  const globalFontStyle = getCustomFontStyle(globalCustomFont ? { name: globalCustomFont.name, url: globalCustomFont.url } : undefined);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        // Fetch active subscription plans for this creator (used to tag products included in subscription)
        const { data: activePlans } = await supabase
          .from('creator_subscription_plans')
          .select('id')
          .eq('creator_id', profileId)
          .eq('is_active', true);
        const activePlanIds = (activePlans || []).map((p) => p.id);

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
          .select("id, name, cover_image_url, is_visible, display_order, style_options")
          .eq("creator_id", profileId)
          .order("display_order", { ascending: true });

        if (!isOwnProfile) collectionsQuery = collectionsQuery.eq("is_visible", true);

        const { data: collectionsData, error: collectionsError } = await collectionsQuery;
        if (collectionsError) throw collectionsError;

        // Fetch products for each collection
        const collectionsWithProducts = await Promise.all(
          (collectionsData || []).map(async (collection) => {
            const { data: items, error: itemsError, count } = await supabase
              .from("collection_items")
              .select("product_id", { count: "exact" })
              .eq("collection_id", collection.id)
              .order("display_order", { ascending: true });

            // Issue #4 fix: Better error logging
            if (itemsError) {
              console.error(`Error fetching collection_items for ${collection.name}:`, itemsError);
            }

            if (!items || items.length === 0) {
              return {
                ...collection,
                display_order: collection.display_order ?? 0,
                is_visible: collection.is_visible ?? true,
                style_options: (collection as any).style_options || {},
                products: [],
                totalCount: 0,
              };
            }

            const productIds = items.map((item) => item.product_id);
            const { data: productsData, error: productsError } = await supabase
              .from("products")
              .select("id, name, cover_image_url, youtube_url, preview_video_url, price_cents, currency, pricing_type, subscription_access, created_at")
              .in("id", productIds)
              .eq("status", "published");

            // Issue #4 fix: Log if products query fails
            if (productsError) {
              console.error(`Error fetching products for collection ${collection.name}:`, productsError);
            }

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

            // Issue #4 fix: Preserve the display_order from collection_items
            const includedIds = new Set<string>();
            if (activePlanIds.length > 0 && productsData && productsData.length > 0) {
              const pIds = productsData.map((p) => p.id);
              const { data: includedRows } = await supabase
                .from('subscription_plan_products')
                .select('product_id')
                .in('plan_id', activePlanIds)
                .in('product_id', pIds);
              (includedRows || []).forEach((r) => includedIds.add(r.product_id));
            }

            const productMap = new Map(
              (productsData || []).map(p => [p.id, {
                ...p,
                included_in_subscription: includedIds.has(p.id),
                likeCount: likeMap.get(p.id) || 0,
                commentCount: commentMap.get(p.id) || 0,
              }])
            );
            
            // Maintain the order from collection_items
            const orderedProducts = productIds
              .map(id => productMap.get(id))
              .filter((p): p is NonNullable<typeof p> => p !== undefined);

            return {
              ...collection,
              display_order: collection.display_order ?? 0,
              is_visible: collection.is_visible ?? true,
              style_options: (collection as any).style_options || {},
              products: orderedProducts,
              totalCount: orderedProducts.length,
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
    <div 
      className={cn("space-y-10", globalFontClass)}
      style={globalFontStyle}
    >
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
          const collectionAnimation = (item.data.style_options?.animation || 'none') as AnimationType;
          return (
            <AnimatedSection
              key={`collection-${item.id}`}
              animation={collectionAnimation}
            >
              <CollectionRow
                id={item.data.id}
                name={item.data.name}
                coverImage={item.data.cover_image_url}
                products={item.data.products}
                totalCount={item.data.totalCount}
              />
            </AnimatedSection>
          );
        } else {
          const styleOpts = item.data.style_options;
          const showBg = styleOpts?.showBackground === true;
          const animation = (styleOpts?.animation || 'none') as AnimationType;
          
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
            <AnimatedSection
              key={`section-${item.id}`}
              animation={animation}
              className={containerClasses}
              style={containerStyle}
            >
              <SectionPreviewContent section={item.data} />
            </AnimatedSection>
          );
        }
      })}
    </div>
  );
}
