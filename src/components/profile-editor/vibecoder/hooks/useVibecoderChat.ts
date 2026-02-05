 import { useState, useCallback } from 'react';
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
   const [pendingOps, setPendingOps] = useState<VibecoderOp[] | null>(null);
   const [pendingAssetRequests, setPendingAssetRequests] = useState<AssetRequest[] | null>(null);
   const [error, setError] = useState<string | null>(null);
 
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
 
       // Call edge function
       const { data, error: invokeError } = await supabase.functions.invoke('storefront-vibecoder', {
         body: {
           message: text,
           context,
           profileId,
         },
       });
 
       if (invokeError) {
         // Handle rate limits and credit errors
         if (invokeError.message?.includes('429')) {
           throw new Error('Rate limit exceeded. Please wait a moment and try again.');
         }
         if (invokeError.message?.includes('402')) {
           throw new Error('Credits exhausted. Please add more credits to continue.');
         }
         throw invokeError;
       }
 
       const response = data as VibecoderResponse;
 
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
       const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
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
   }, []);
 
   return {
     messages,
     isLoading,
     error,
     pendingOps,
     pendingAssetRequests,
     sendMessage,
     applyPendingOps,
     discardPendingOps,
     regenerate,
     clearChat,
   };
 }