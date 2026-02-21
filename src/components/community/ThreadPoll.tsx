import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

interface ThreadPollProps {
  threadId: string;
  profileId: string | null;
}

interface PollVote {
  poll_id: string;
  user_id: string;
  option_index: number;
}

export function ThreadPoll({ threadId, profileId }: ThreadPollProps) {
  const queryClient = useQueryClient();

  const { data: poll } = useQuery({
    queryKey: ['thread-poll', threadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('thread_polls')
        .select('*')
        .eq('thread_id', threadId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: votes = [] } = useQuery({
    queryKey: ['thread-poll-votes', poll?.id],
    queryFn: async () => {
      if (!poll?.id) return [];
      const { data, error } = await supabase
        .from('thread_poll_votes')
        .select('*')
        .eq('poll_id', poll.id);
      if (error) throw error;
      return (data || []) as PollVote[];
    },
    enabled: !!poll?.id,
  });

  const userVote = votes.find(v => v.user_id === profileId);
  const totalVotes = votes.length;
  const isExpired = poll ? new Date(poll.expires_at) < new Date() : false;
  const hasVoted = !!userVote;

  const voteMutation = useMutation({
    mutationFn: async (optionIndex: number) => {
      if (!profileId || !poll) throw new Error('Not logged in');

      if (userVote) {
        // Remove existing vote
        await supabase.from('thread_poll_votes').delete().eq('poll_id', poll.id).eq('user_id', profileId);
        // If clicking the same option, just unvote
        if (userVote.option_index === optionIndex) return;
      }
      // Cast new vote
      const { error } = await supabase.from('thread_poll_votes').insert({
        poll_id: poll.id,
        user_id: profileId,
        option_index: optionIndex,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread-poll-votes', poll?.id] });
    },
    onError: (e: any) => {
      toast.error(e.message || 'Failed to vote');
    },
  });

  if (!poll) return null;

  const options = poll.options as string[];
  const showResults = hasVoted || isExpired;

  return (
    <div className="mt-3 space-y-2">
      {options.map((option, index) => {
        const optionVotes = votes.filter(v => v.option_index === index).length;
        const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
        const isSelected = userVote?.option_index === index;

        return (
          <button
            key={index}
            onClick={() => !isExpired && profileId && voteMutation.mutate(index)}
            disabled={isExpired || !profileId || voteMutation.isPending}
            className={cn(
              "relative w-full text-left px-4 py-2.5 rounded-xl border transition-all text-sm overflow-hidden",
              isSelected
                ? "border-primary/50 bg-primary/5"
                : "border-border/50 bg-transparent hover:border-border"
            )}
          >
            {/* Progress bar background */}
            {showResults && (
              <div
                className="absolute inset-0 bg-primary/10 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            )}
            <div className="relative flex items-center justify-between">
              <span className={cn("font-medium", isSelected && "text-primary")}>
                {option}
              </span>
              <div className="flex items-center gap-2">
                {showResults && (
                  <span className="text-xs text-muted-foreground">{percentage}%</span>
                )}
                {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
              </div>
            </div>
          </button>
        );
      })}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
        <span>{isExpired ? 'Poll ended' : `Ends ${formatTimeLeft(poll.expires_at)}`}</span>
      </div>
    </div>
  );
}

function formatTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'now';
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `in ${hours}h`;
  const days = Math.floor(hours / 24);
  return `in ${days}d`;
}
