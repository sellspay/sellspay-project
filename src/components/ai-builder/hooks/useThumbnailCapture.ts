import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseThumbnailCaptureOptions {
  projectId: string | null;
  enabled: boolean;
  onThumbnailUpdated?: (url: string) => void;
}

/**
 * Listens for postMessage from the Sandpack iframe containing a screenshot ArrayBuffer,
 * uploads it to storage, and updates the project's thumbnail_url.
 */
export function useThumbnailCapture({ projectId, enabled, onThumbnailUpdated }: UseThumbnailCaptureOptions) {
  const isCapturingRef = useRef(false);

  // Request capture by sending postMessage to the Sandpack iframe
  const requestCapture = useCallback(() => {
    if (!enabled || !projectId || isCapturingRef.current) return;

    // Find the Sandpack preview iframe
    const iframe = document.querySelector('.sp-preview-iframe') as HTMLIFrameElement | null;
    if (!iframe?.contentWindow) {
      console.warn('[ThumbnailCapture] No Sandpack iframe found');
      return;
    }

    console.log('[ThumbnailCapture] Requesting capture for project:', projectId);
    iframe.contentWindow.postMessage({ type: 'VIBECODER_CAPTURE_REQUEST' }, '*');
  }, [enabled, projectId]);

  // Listen for capture response from iframe
  useEffect(() => {
    if (!enabled || !projectId) return;

    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type !== 'VIBECODER_CAPTURE_RESPONSE') return;
      if (isCapturingRef.current) return;
      isCapturingRef.current = true;

      try {
        const arrayBuffer: ArrayBuffer = event.data.buffer;
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          console.warn('[ThumbnailCapture] Empty buffer received');
          return;
        }

        console.log('[ThumbnailCapture] Received screenshot:', arrayBuffer.byteLength, 'bytes');

        // Create blob and upload
        const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
        const filePath = `project-thumbs/${projectId}/hero.jpg`;

        // Upload to site-assets bucket (upsert to overwrite old thumbnails)
        const { error: uploadError } = await supabase.storage
          .from('site-assets')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          console.error('[ThumbnailCapture] Upload failed:', uploadError);
          return;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('site-assets')
          .getPublicUrl(filePath);

        const thumbnailUrl = `${urlData.publicUrl}?t=${Date.now()}`; // Cache-bust

        // Update project record
        const { error: updateError } = await supabase
          .from('vibecoder_projects')
          .update({ thumbnail_url: thumbnailUrl })
          .eq('id', projectId);

        if (updateError) {
          console.error('[ThumbnailCapture] DB update failed:', updateError);
          return;
        }

        console.log('[ThumbnailCapture] ✅ Thumbnail saved:', thumbnailUrl);
        onThumbnailUpdated?.(thumbnailUrl);
      } catch (err) {
        console.error('[ThumbnailCapture] Error:', err);
      } finally {
        isCapturingRef.current = false;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [enabled, projectId, onThumbnailUpdated]);

  return { requestCapture };
}
