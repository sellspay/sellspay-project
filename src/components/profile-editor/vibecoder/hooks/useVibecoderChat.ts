import { useState, useCallback, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { ChatMessage, VibecoderOp, VibecoderResponse, BrandProfile, AssetRequest } from '../types';
 import { ProfileSection, SECTION_TEMPLATES } from '../../types';
 
 interface UseVibecoderChatProps {
   profileId: string;
   sections: ProfileSection[];
   brandProfile: BrandProfile | null;
 }
 
 export function useVibecoderChat({ profileId, sections, brandProfile }: UseVibecoderChatProps) {
   const [messages, setMessages] = useState<ChatMessage[]>([]);
   const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [historyOffset, setHistoryOffset] = useState(0);
  const PAGE_SIZE = 20;
   const [pendingOps, setPendingOps] = useState<VibecoderOp[] | null>(null);
   const [pendingAssetRequests, setPendingAssetRequests] = useState<AssetRequest[] | null>(null);
   const [error, setError] = useState<string | null>(null);

  // Load persisted chat history on mount
  useEffect(() => {
    if (!profileId) return;

    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        // Count total for "has more"
        const { count } = await supabase
          .from('storefront_ai_conversations')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', profileId);

        // Fetch last PAGE_SIZE messages (newest first, then reverse for display)
        const { data, error: fetchError } = await supabase
          .from('storefront_ai_conversations')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
          .range(0, PAGE_SIZE - 1);

        if (fetchError) throw fetchError;

        const loaded: ChatMessage[] = (data || []).reverse().map(row => ({
          id: row.id,
          role: row.role as 'user' | 'assistant',
          content: row.content,
          operations: (row.operations as unknown) as VibecoderOp[] | undefined,
          asset_requests: (row.asset_requests as unknown) as AssetRequest[] | undefined,
          timestamp: new Date(row.created_at),
          status: 'applied' as const, // historical messages are already applied
        }));

        setMessages(loaded);
        setHistoryOffset(loaded.length);
        setHasMoreHistory((count || 0) > PAGE_SIZE);
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [profileId]);

  // Load more (older) messages
  const loadMoreHistory = useCallback(async () => {
    if (isLoadingHistory || !hasMoreHistory) return;

    setIsLoadingHistory(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('storefront_ai_conversations')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .range(historyOffset, historyOffset + PAGE_SIZE - 1);

      if (fetchError) throw fetchError;

      const older: ChatMessage[] = (data || []).reverse().map(row => ({
        id: row.id,
        role: row.role as 'user' | 'assistant',
        content: row.content,
        operations: (row.operations as unknown) as VibecoderOp[] | undefined,
        asset_requests: (row.asset_requests as unknown) as AssetRequest[] | undefined,
        timestamp: new Date(row.created_at),
        status: 'applied' as const,
      }));

      if (older.length > 0) {
        // Prepend older messages
        setMessages(prev => [...older, ...prev]);
        setHistoryOffset(prev => prev + older.length);
      }

      if (older.length < PAGE_SIZE) {
        setHasMoreHistory(false);
      }
    } catch (err) {
      console.error('Failed to load more history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [profileId, historyOffset, isLoadingHistory, hasMoreHistory]);
 
   const sendMessage = useCallback(async (text: string) => {
     if (!text.trim() || isLoading) return;
 
     setError(null);
     setIsLoading(true);
 
     // Add user message
     const userMessage: ChatMessage = {
       id: crypto.randomUUID(),
       role: 'user',
       content: text,
       timestamp: new Date(),
     };
     setMessages(prev => [...prev, userMessage]);
 
      try {
       // Build context for AI
       const context = {
         sections: sections.map(s => ({
           id: s.id,
           type: s.section_type,
           content: s.content,
           style_options: s.style_options,
           is_visible: s.is_visible,
         })),
         supportedSectionTypes: SECTION_TEMPLATES.map(t => ({
           type: t.type,
           name: t.name,
           category: t.category,
         })),
         brandProfile: brandProfile ? {
           colorPalette: brandProfile.colorPalette,
           vibeTags: brandProfile.vibeTags,
           fontPreference: brandProfile.fontPreference,
         } : null,
         conversationHistory: messages.slice(-10).map(m => ({
           role: m.role,
           content: m.content,
         })),
       };
 
        // Call backend function (direct fetch) with a hard timeout so we never spin forever
        const controller = new AbortController();
        const timeoutMs = 60_000; // 60 seconds to allow complex AI generations
        const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

        let response: VibecoderResponse;
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token;
          if (!accessToken) throw new Error('You need to be logged in to use the AI Builder.');

          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/storefront-vibecoder`;
          const resp = await fetch(url, {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              message: text,
              context,
              profileId,
            }),
          });

          let payload: any = null;
          try {
            payload = await resp.json();
          } catch {
            // ignore
          }

          if (!resp.ok) {
            if (resp.status === 429) throw new Error(payload?.error || 'Rate limit exceeded. Please wait and try again.');
            if (resp.status === 402) throw new Error(payload?.error || 'Credits exhausted. Please add more credits.');
            throw new Error(payload?.error || `AI request failed (${resp.status}).`);
          }

          response = payload as VibecoderResponse;
        } finally {
          window.clearTimeout(timeoutId);
        }
 
       // Add assistant message
       const assistantMessage: ChatMessage = {
         id: crypto.randomUUID(),
         role: 'assistant',
         content: response.message,
         operations: response.ops,
         asset_requests: response.asset_requests,
         timestamp: new Date(),
         status: 'pending',
       };
       setMessages(prev => [...prev, assistantMessage]);
 
       // Store pending operations
       if (response.ops && response.ops.length > 0) {
         setPendingOps(response.ops);
       }
       if (response.asset_requests && response.asset_requests.length > 0) {
         setPendingAssetRequests(response.asset_requests);
       }
 
       // Save to database for context
       await supabase.from('storefront_ai_conversations').insert([
         { profile_id: profileId, role: 'user', content: text },
         { 
           profile_id: profileId, 
           role: 'assistant', 
           content: response.message,
          operations: JSON.parse(JSON.stringify(response.ops || [])),
          asset_requests: JSON.parse(JSON.stringify(response.asset_requests || [])),
         },
       ]);
 
      } catch (err) {
       console.error('Error in vibecoder chat:', err);
        const errorMessage =
          err instanceof DOMException && err.name === 'AbortError'
            ? 'AI request timed out. Please try again.'
            : err instanceof Error
              ? err.message
              : 'Something went wrong. Please try again.';
       setError(errorMessage);
       
       // Add error message to chat
       const errorChatMessage: ChatMessage = {
         id: crypto.randomUUID(),
         role: 'assistant',
         content: `I encountered an error: ${errorMessage}`,
         timestamp: new Date(),
       };
       setMessages(prev => [...prev, errorChatMessage]);
     } finally {
       setIsLoading(false);
     }
   }, [profileId, sections, brandProfile, messages, isLoading]);
 
   const applyPendingOps = useCallback(() => {
     // Mark last assistant message as applied
     setMessages(prev => prev.map((m, i) => 
       i === prev.length - 1 && m.role === 'assistant' 
         ? { ...m, status: 'applied' as const }
         : m
     ));
     const ops = pendingOps;
     setPendingOps(null);
     return ops;
   }, [pendingOps]);

    const clearPendingAssetRequests = useCallback(() => {
      setPendingAssetRequests(null);
    }, []);
 
   const discardPendingOps = useCallback(() => {
     setMessages(prev => prev.map((m, i) => 
       i === prev.length - 1 && m.role === 'assistant' 
         ? { ...m, status: 'discarded' as const }
         : m
     ));
     setPendingOps(null);
     setPendingAssetRequests(null);
   }, []);
 
   const regenerate = useCallback(() => {
     // Get the last user message and resend
     const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
     if (lastUserMessage) {
       // Remove the last assistant response
       setMessages(prev => {
         const lastIndex = prev.length - 1;
         if (prev[lastIndex]?.role === 'assistant') {
           return prev.slice(0, -1);
         }
         return prev;
       });
       setPendingOps(null);
       setPendingAssetRequests(null);
       sendMessage(lastUserMessage.content + ' (regenerated)');
     }
   }, [messages, sendMessage]);
 
   const clearChat = useCallback(() => {
     setMessages([]);
     setPendingOps(null);
     setPendingAssetRequests(null);
     setError(null);
    setHistoryOffset(0);
    setHasMoreHistory(false);
    // Optionally: also delete from DB if user wants a fresh start
    supabase
      .from('storefront_ai_conversations')
      .delete()
      .eq('profile_id', profileId)
      .then(() => {});
   }, [profileId]);
 
   return {
     messages,
     isLoading,
    isLoadingHistory,
    hasMoreHistory,
     error,
     pendingOps,
     pendingAssetRequests,
     sendMessage,
     applyPendingOps,
     discardPendingOps,
     regenerate,
     clearChat,
      clearPendingAssetRequests,
    loadMoreHistory,
   };
 }