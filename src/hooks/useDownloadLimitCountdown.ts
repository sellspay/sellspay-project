import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DownloadLimitInfo {
  remaining: number;
  totalUsed: number;
  resetDate: Date | null;
  daysUntilReset: number;
  hoursUntilReset: number;
  minutesUntilReset: number;
  isLocked: boolean;
}

export function useDownloadLimitCountdown(
  productId: string | undefined,
  userProfileId: string | null,
  isOwner: boolean
) {
  const [limitInfo, setLimitInfo] = useState<DownloadLimitInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLimitInfo = useCallback(async () => {
    if (!productId || !userProfileId || isOwner) {
      setLimitInfo(null);
      setLoading(false);
      return;
    }

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: downloads } = await supabase
        .from('product_downloads')
        .select('downloaded_at')
        .eq('user_id', userProfileId)
        .eq('product_id', productId)
        .gte('downloaded_at', sevenDaysAgo.toISOString())
        .order('downloaded_at', { ascending: true });

      const totalUsed = downloads?.length || 0;
      const remaining = Math.max(0, 2 - totalUsed);
      const isLocked = remaining === 0;

      let resetDate: Date | null = null;
      let daysUntilReset = 0;
      let hoursUntilReset = 0;
      let minutesUntilReset = 0;

      if (totalUsed > 0 && downloads && downloads.length > 0) {
        // Reset is based on the OLDEST download expiring (7 days from it)
        const oldestDownload = new Date(downloads[0].downloaded_at);
        resetDate = new Date(oldestDownload.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const now = Date.now();
        const msUntilReset = resetDate.getTime() - now;
        
        if (msUntilReset > 0) {
          daysUntilReset = Math.floor(msUntilReset / (24 * 60 * 60 * 1000));
          hoursUntilReset = Math.floor((msUntilReset % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
          minutesUntilReset = Math.floor((msUntilReset % (60 * 60 * 1000)) / (60 * 1000));
        }
      }

      setLimitInfo({
        remaining,
        totalUsed,
        resetDate,
        daysUntilReset,
        hoursUntilReset,
        minutesUntilReset,
        isLocked,
      });
    } catch (error) {
      console.error('Error fetching download limit info:', error);
    } finally {
      setLoading(false);
    }
  }, [productId, userProfileId, isOwner]);

  // Initial fetch
  useEffect(() => {
    fetchLimitInfo();
  }, [fetchLimitInfo]);

  // Update countdown every minute
  useEffect(() => {
    if (!limitInfo?.resetDate) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const msUntilReset = limitInfo.resetDate!.getTime() - now;

      if (msUntilReset <= 0) {
        // Reset period has passed - refetch to unlock
        fetchLimitInfo();
        return;
      }

      const daysUntilReset = Math.floor(msUntilReset / (24 * 60 * 60 * 1000));
      const hoursUntilReset = Math.floor((msUntilReset % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutesUntilReset = Math.floor((msUntilReset % (60 * 60 * 1000)) / (60 * 1000));

      setLimitInfo(prev => prev ? {
        ...prev,
        daysUntilReset,
        hoursUntilReset,
        minutesUntilReset,
      } : null);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [limitInfo?.resetDate, fetchLimitInfo]);

  // Format the countdown string
  const getCountdownString = useCallback(() => {
    if (!limitInfo) return '';
    
    const { daysUntilReset, hoursUntilReset, isLocked } = limitInfo;
    
    if (!isLocked) return '';
    
    if (daysUntilReset > 0) {
      return `${daysUntilReset}d ${hoursUntilReset}h`;
    } else if (hoursUntilReset > 0) {
      return `${hoursUntilReset}h ${limitInfo.minutesUntilReset}m`;
    } else {
      return `${limitInfo.minutesUntilReset}m`;
    }
  }, [limitInfo]);

  return {
    limitInfo,
    loading,
    refetch: fetchLimitInfo,
    getCountdownString,
  };
}
