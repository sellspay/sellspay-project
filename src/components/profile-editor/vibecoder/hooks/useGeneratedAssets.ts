 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { GeneratedAsset } from '../types';
 
 export function useGeneratedAssets(profileId: string) {
   const [assets, setAssets] = useState<GeneratedAsset[]>([]);
   const [loading, setLoading] = useState(true);
   const [generating, setGenerating] = useState(false);
 
   // Fetch draft assets
   useEffect(() => {
     if (!profileId) return;
 
     const fetchAssets = async () => {
       setLoading(true);
       try {
         const { data, error } = await supabase
           .from('storefront_generated_assets')
           .select('*')
           .eq('profile_id', profileId)
           .eq('status', 'draft')
           .order('created_at', { ascending: false });
 
         if (error) throw error;
 
         setAssets((data || []).map(row => ({
           id: row.id,
           profileId: row.profile_id,
           url: row.asset_url,
           type: row.asset_type as GeneratedAsset['type'],
           prompt: row.prompt || '',
           spec: row.spec as GeneratedAsset['spec'],
           status: row.status as GeneratedAsset['status'],
           createdAt: new Date(row.created_at),
         })));
       } catch (err) {
         console.error('Error fetching generated assets:', err);
       } finally {
         setLoading(false);
       }
     };
 
     fetchAssets();
   }, [profileId]);
 
   const generateAsset = useCallback(async (
     type: GeneratedAsset['type'],
     prompt: string,
     spec?: GeneratedAsset['spec']
   ) => {
     setGenerating(true);
     try {
       const { data, error } = await supabase.functions.invoke('storefront-generate-asset', {
         body: { profileId, type, prompt, spec },
       });
 
       if (error) throw error;
 
       // Add to local state
       const newAsset: GeneratedAsset = {
         id: data.id,
         profileId,
         url: data.url,
         type,
         prompt,
         spec,
         status: 'draft',
         createdAt: new Date(),
       };
 
       setAssets(prev => [newAsset, ...prev]);
       return newAsset;
     } catch (err) {
       console.error('Error generating asset:', err);
       throw err;
     } finally {
       setGenerating(false);
     }
   }, [profileId]);
 
   const applyAsset = useCallback(async (assetId: string) => {
     try {
       const { error } = await supabase
         .from('storefront_generated_assets')
         .update({ status: 'applied' })
         .eq('id', assetId);
 
       if (error) throw error;
 
       setAssets(prev => prev.filter(a => a.id !== assetId));
     } catch (err) {
       console.error('Error applying asset:', err);
       throw err;
     }
   }, []);
 
   const discardAsset = useCallback(async (assetId: string) => {
     try {
       const { error } = await supabase
         .from('storefront_generated_assets')
         .update({ status: 'discarded' })
         .eq('id', assetId);
 
       if (error) throw error;
 
       setAssets(prev => prev.filter(a => a.id !== assetId));
     } catch (err) {
       console.error('Error discarding asset:', err);
       throw err;
     }
   }, []);
 
   return {
     assets,
     loading,
     generating,
     generateAsset,
     applyAsset,
     discardAsset,
   };
 }