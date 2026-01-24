import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Megaphone, Shield, FileText, Sparkles, Wrench, Pin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const categories = [
  { value: 'announcement', label: 'Announcement', icon: Megaphone },
  { value: 'privacy', label: 'Privacy', icon: Shield },
  { value: 'terms', label: 'Terms', icon: FileText },
  { value: 'feature', label: 'Feature', icon: Sparkles },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench },
];

export function UpdateComposer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('announcement');
  const [isPinned, setIsPinned] = useState(false);

  // Get user's profile ID
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Profile not found');

      const { error } = await supabase.from('platform_updates').insert({
        author_id: profile.id,
        title: title.trim(),
        content: content.trim(),
        category,
        is_pinned: isPinned,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-updates'] });
      setTitle('');
      setContent('');
      setCategory('announcement');
      setIsPinned(false);
      toast.success('Update published successfully!');
    },
    onError: (error) => {
      console.error('Failed to publish update:', error);
      toast.error('Failed to publish update');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    createMutation.mutate();
  };

  const selectedCategory = categories.find((c) => c.value === category);
  const SelectedIcon = selectedCategory?.icon || Megaphone;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-card/80 to-orange-500/10 backdrop-blur-xl border-amber-500/20">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />

      <CardContent className="p-6 relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Publish Update</h3>
            <p className="text-xs text-muted-foreground">Share platform announcements with your community</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Update title..."
              className="bg-background/50 border-border/50 focus:border-amber-500/50"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-background/50 border-border/50">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <SelectedIcon className="h-4 w-4" />
                    {selectedCategory?.label}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <cat.icon className="h-4 w-4" />
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your update content..."
              className="min-h-[150px] bg-background/50 border-border/50 focus:border-amber-500/50 resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length} characters
            </p>
          </div>

          {/* Pin Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-background/30 border border-border/30">
            <div className="flex items-center gap-3">
              <Pin className="h-4 w-4 text-amber-400" />
              <div>
                <Label htmlFor="pin-toggle" className="cursor-pointer">Pin this update</Label>
                <p className="text-xs text-muted-foreground">Pinned updates appear at the top</p>
              </div>
            </div>
            <Switch
              id="pin-toggle"
              checked={isPinned}
              onCheckedChange={setIsPinned}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={createMutation.isPending || !title.trim() || !content.trim()}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/25"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Megaphone className="h-4 w-4 mr-2" />
                Publish Update
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
