 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { BrandProfile } from '../types';
 
 export function useBrandProfile(profileId: string) {
   const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   // Fetch or create brand profile
   useEffect(() => {
     if (!profileId) return;
 
     const fetchBrandProfile = async () => {
       setLoading(true);
       setError(null);
 
       try {
         // Try to get existing profile
         const { data, error: fetchError } = await supabase
           .from('storefront_brand_profiles')
           .select('*')
           .eq('profile_id', profileId)
           .maybeSingle();
 
         if (fetchError) throw fetchError;
 
         if (data) {
           setBrandProfile({
             id: data.id,
             profileId: data.profile_id,
             colorPalette: (data.color_palette as string[]) || [],
             vibeTags: data.vibe_tags || [],
             fontPreference: data.font_preference || 'default',
             referenceImages: (data.reference_images as string[]) || [],
           });
         } else {
           // Create default profile
           const { data: newData, error: createError } = await supabase
             .from('storefront_brand_profiles')
             .insert({
               profile_id: profileId,
               color_palette: [],
               vibe_tags: [],
               font_preference: 'default',
               reference_images: [],
             })
             .select()
             .single();
 
           if (createError) throw createError;
 
           setBrandProfile({
             id: newData.id,
             profileId: newData.profile_id,
             colorPalette: [],
             vibeTags: [],
             fontPreference: 'default',
             referenceImages: [],
           });
         }
       } catch (err) {
         console.error('Error fetching brand profile:', err);
         setError(err instanceof Error ? err.message : 'Failed to load brand profile');
       } finally {
         setLoading(false);
       }
     };
 
     fetchBrandProfile();
   }, [profileId]);
 
   const updateBrandProfile = useCallback(async (updates: Partial<Omit<BrandProfile, 'id' | 'profileId'>>) => {
     if (!brandProfile) return;
 
     try {
       const { error: updateError } = await supabase
         .from('storefront_brand_profiles')
         .update({
           color_palette: updates.colorPalette ?? brandProfile.colorPalette,
           vibe_tags: updates.vibeTags ?? brandProfile.vibeTags,
           font_preference: updates.fontPreference ?? brandProfile.fontPreference,
           reference_images: updates.referenceImages ?? brandProfile.referenceImages,
         })
         .eq('id', brandProfile.id);
 
       if (updateError) throw updateError;
 
       setBrandProfile(prev => prev ? { ...prev, ...updates } : null);
     } catch (err) {
       console.error('Error updating brand profile:', err);
       throw err;
     }
   }, [brandProfile]);
 
   const addColor = useCallback((color: string) => {
     if (!brandProfile) return;
     const newPalette = [...brandProfile.colorPalette, color];
     updateBrandProfile({ colorPalette: newPalette });
   }, [brandProfile, updateBrandProfile]);
 
   const removeColor = useCallback((index: number) => {
     if (!brandProfile) return;
     const newPalette = brandProfile.colorPalette.filter((_, i) => i !== index);
     updateBrandProfile({ colorPalette: newPalette });
   }, [brandProfile, updateBrandProfile]);
 
   const addVibeTag = useCallback((tag: string) => {
     if (!brandProfile) return;
     if (!brandProfile.vibeTags.includes(tag)) {
       const newTags = [...brandProfile.vibeTags, tag];
       updateBrandProfile({ vibeTags: newTags });
     }
   }, [brandProfile, updateBrandProfile]);
 
   const removeVibeTag = useCallback((tag: string) => {
     if (!brandProfile) return;
     const newTags = brandProfile.vibeTags.filter(t => t !== tag);
     updateBrandProfile({ vibeTags: newTags });
   }, [brandProfile, updateBrandProfile]);
 
   return {
     brandProfile,
     loading,
     error,
     updateBrandProfile,
     addColor,
     removeColor,
     addVibeTag,
     removeVibeTag,
   };
 }