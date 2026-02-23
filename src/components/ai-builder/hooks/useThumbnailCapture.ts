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

  // Find the Sandpack iframe using multiple strategies
  const findIframe = useCallback((): HTMLIFrameElement | null => {
    // Strategy 1: Standard Sandpack class
    const sp = document.querySelector('.sp-preview-iframe') as HTMLIFrameElement | null;
    if (sp?.contentWindow) return sp;
    // Strategy 2: Container lookup
    const container = document.querySelector('.sp-preview-container, .sp-preview');
    if (container) {
      const iframe = container.querySelector('iframe') as HTMLIFrameElement | null;
      if (iframe?.contentWindow) return iframe;
    }
    // Strategy 3: Any iframe on the page
    const allIframes = document.querySelectorAll('iframe');
    for (const iframe of allIframes) {
      if (iframe.src?.includes('sandpack') || iframe.src?.includes('codesandbox') || iframe.className?.includes('sp-')) {
        if (iframe.contentWindow) return iframe;
      }
    }
    if (allIframes.length > 0 && allIframes[0].contentWindow) {
      return allIframes[0] as HTMLIFrameElement;
    }
    return null;
  }, []);

  // Fire-and-forget capture request — never blocks preview
  const requestCapture = useCallback(() => {
    if (!enabled || !projectId || isCapturingRef.current) return;

    const iframe = findIframe();
    if (!iframe?.contentWindow) {
      // No iframe available — skip silently, don't retry
      return;
    }

    iframe.contentWindow.postMessage({ type: 'VIBECODER_CAPTURE_REQUEST' }, '*');
  }, [enabled, projectId, findIframe]);

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
