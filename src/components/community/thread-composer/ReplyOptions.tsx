import { useState } from 'react';
import { MessageSquarePlus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const REPLY_OPTIONS = [
  { id: 'anyone', label: 'Anyone' },
  { id: 'followers', label: 'Your followers' },
  { id: 'following', label: 'Profiles you follow' },
  { id: 'mentioned', label: 'Profiles you mention' },
];

export interface ReplySettings {
  whoCanReply: string;
  reviewReplies: boolean;
}

interface ReplyOptionsProps {
  settings: ReplySettings;
  onChange: (settings: ReplySettings) => void;
}

export function ReplyOptions({ settings, onChange }: ReplyOptionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <MessageSquarePlus className="h-4 w-4" />
          Reply options
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 bg-popover border-border/50 shadow-xl rounded-xl" align="start" side="top">
        <div className="px-4 pt-3 pb-2">
          <span className="text-xs text-muted-foreground">Who can reply and quote</span>
        </div>
        <div className="py-1">
          {REPLY_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => onChange({ ...settings, whoCanReply: opt.id })}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-muted/40 transition-colors"
            >
              {opt.label}
              {settings.whoCanReply === opt.id && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
          <span className="text-sm text-foreground">Review and approve replies</span>
          <Switch
            checked={settings.reviewReplies}
            onCheckedChange={(v) => onChange({ ...settings, reviewReplies: v })}
            className="scale-90"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
