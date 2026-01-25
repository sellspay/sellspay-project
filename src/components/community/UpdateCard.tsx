import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Megaphone,
  Shield,
  FileText,
  Sparkles,
  Wrench,
  Pin,
  Trash2,
  ChevronDown,
  ChevronUp,
  Bot,
} from 'lucide-react';
import { toast } from 'sonner';
import platformLogo from '@/assets/hero-logo.png';

interface UpdateCardProps {
  update: {
    id: string;
    author_id: string;
    title: string;
    content: string;
    category: string;
    is_pinned: boolean;
    created_at: string;
  };
  isOwner?: boolean;
}

const categoryConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  announcement: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Megaphone, label: 'Announcement' },
  privacy: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Shield, label: 'Privacy' },
  terms: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: FileText, label: 'Terms' },
  feature: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: Sparkles, label: 'Feature' },
  maintenance: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Wrench, label: 'Maintenance' },
};

export function UpdateCard({ update, isOwner }: UpdateCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const category = categoryConfig[update.category] || categoryConfig.announcement;
  const CategoryIcon = category.icon;

  const shouldTruncate = update.content.length > 200;
  const displayContent = expanded || !shouldTruncate 
    ? update.content 
    : update.content.slice(0, 200) + '...';

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('platform_updates')
        .delete()
        .eq('id', update.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-updates'] });
      toast.success('Update deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete update');
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('platform_updates')
        .update({ is_pinned: !update.is_pinned })
        .eq('id', update.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-updates'] });
      toast.success(update.is_pinned ? 'Update unpinned' : 'Update pinned');
    },
    onError: () => {
      toast.error('Failed to update pin status');
    },
  });

  return (
    <>
      <Card className="relative overflow-hidden bg-card/60 backdrop-blur-xl border-border/40 hover:border-border/60 transition-all duration-300 group">
        {/* Gradient overlay for pinned */}
        {update.is_pinned && (
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />
        )}

        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              {/* Bot Avatar with amber glow */}
              <Avatar className="h-10 w-10 ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/20">
                <AvatarImage src={platformLogo} className="object-contain p-0.5" />
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold">
                  EP
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    EditorsParadise
                  </span>
                  {/* BOT Badge */}
                  <Badge 
                    variant="outline" 
                    className="px-1.5 py-0 text-[10px] font-semibold bg-amber-500/20 text-amber-400 border-amber-500/40 uppercase tracking-wide"
                  >
                    <Bot className="h-2.5 w-2.5 mr-0.5" />
                    Bot
                  </Badge>
                  <VerifiedBadge isOwner />
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {update.is_pinned && (
                <Pin className="h-4 w-4 text-amber-400" />
              )}
              <Badge variant="outline" className={`${category.color} flex items-center gap-1.5`}>
                <CategoryIcon className="h-3.5 w-3.5" />
                {category.label}
              </Badge>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
            {update.title}
          </h3>

          {/* Content */}
          <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {displayContent}
          </div>

          {/* Expand/Collapse Button */}
          {shouldTruncate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="mt-3 text-primary hover:text-primary/80"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Read more
                </>
              )}
            </Button>
          )}

          {/* Owner Actions */}
          {isOwner && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => togglePinMutation.mutate()}
                disabled={togglePinMutation.isPending}
                className="text-muted-foreground hover:text-amber-400"
              >
                <Pin className="h-4 w-4 mr-1" />
                {update.is_pinned ? 'Unpin' : 'Pin'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this update? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
