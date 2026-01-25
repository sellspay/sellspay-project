import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

// Extract domain from referrer URL
function extractDomain(referrer: string): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    return url.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

// Get referrer category for grouping
function categorizeReferrer(domain: string | null): string {
  if (!domain) return 'Direct';
  
  const lowerDomain = domain.toLowerCase();
  
  if (lowerDomain.includes('google')) return 'Google';
  if (lowerDomain.includes('youtube')) return 'YouTube';
  if (lowerDomain.includes('twitter') || lowerDomain.includes('x.com')) return 'Twitter/X';
  if (lowerDomain.includes('facebook') || lowerDomain.includes('fb.com')) return 'Facebook';
  if (lowerDomain.includes('instagram')) return 'Instagram';
  if (lowerDomain.includes('tiktok')) return 'TikTok';
  if (lowerDomain.includes('reddit')) return 'Reddit';
  if (lowerDomain.includes('discord')) return 'Discord';
  if (lowerDomain.includes('linkedin')) return 'LinkedIn';
  if (lowerDomain.includes('pinterest')) return 'Pinterest';
  
  return domain;
}

// Fetch country code using a geolocation API
async function getGeoData(): Promise<{ countryCode: string | null; city: string | null }> {
  try {
    // Use a free geolocation service
    const response = await fetch('https://ipapi.co/json/', { 
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    if (!response.ok) throw new Error('Geo fetch failed');
    const data = await response.json();
    return {
      countryCode: data.country_code || null,
      city: data.city || null
    };
  } catch {
    return { countryCode: null, city: null };
  }
}

// Track a product page view
export function useProductViewTracking(productId: string | undefined) {
  const { profile } = useAuth();
  
  useEffect(() => {
    if (!productId) return;
    
    const trackView = async () => {
      try {
        const referrer = document.referrer || '';
        const referrerDomain = categorizeReferrer(extractDomain(referrer));
        const { countryCode, city } = await getGeoData();
        
        await supabase.from('product_views').insert({
          product_id: productId,
          viewer_id: profile?.id || null,
          referrer: referrer || null,
          referrer_domain: referrerDomain,
          country_code: countryCode,
          city: city
        });
      } catch (error) {
        console.error('Failed to track product view:', error);
      }
    };
    
    // Small delay to avoid tracking on quick navigations
    const timer = setTimeout(trackView, 500);
    return () => clearTimeout(timer);
  }, [productId, profile?.id]);
}

// Track a profile page view
export function useProfileViewTracking(profileId: string | undefined) {
  const { profile: currentProfile } = useAuth();
  
  useEffect(() => {
    if (!profileId) return;
    // Don't track own profile views
    if (currentProfile?.id === profileId) return;
    
    const trackView = async () => {
      try {
        const referrer = document.referrer || '';
        const referrerDomain = categorizeReferrer(extractDomain(referrer));
        const { countryCode, city } = await getGeoData();
        
        await supabase.from('profile_views').insert({
          profile_id: profileId,
          viewer_id: currentProfile?.id || null,
          referrer: referrer || null,
          referrer_domain: referrerDomain,
          country_code: countryCode,
          city: city
        });
      } catch (error) {
        console.error('Failed to track profile view:', error);
      }
    };
    
    const timer = setTimeout(trackView, 500);
    return () => clearTimeout(timer);
  }, [profileId, currentProfile?.id]);
}
