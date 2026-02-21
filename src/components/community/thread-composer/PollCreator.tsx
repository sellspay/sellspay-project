import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DURATION_OPTIONS = [
  { value: '24h', label: '24 hours' },
  { value: '3d', label: '3 days' },
  { value: '7d', label: '7 days' },
];

export interface PollData {
  options: string[];
  duration: string;
}

interface PollCreatorProps {
  poll: PollData;
  onChange: (poll: PollData) => void;
  onRemove: () => void;
}

export function PollCreator({ poll, onChange, onRemove }: PollCreatorProps) {
  const updateOption = (index: number, value: string) => {
    const newOptions = [...poll.options];
    newOptions[index] = value;
    onChange({ ...poll, options: newOptions });
  };

  const addOption = () => {
    if (poll.options.length < 4) {
      onChange({ ...poll, options: [...poll.options, ''] });
    }
  };

  const removeOption = (index: number) => {
    if (poll.options.length > 2) {
      const newOptions = poll.options.filter((_, i) => i !== index);
      onChange({ ...poll, options: newOptions });
    }
  };

  return (
    <div className="space-y-3 mt-3">
      {/* Poll options */}
      <div className="space-y-2">
        {poll.options.map((option, index) => (
          <div key={index} className="relative">
            <Input
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={index === 0 ? 'Yes' : index === 1 ? 'No' : `Option ${index + 1}`}
              className="h-11 bg-transparent border-border/50 rounded-xl text-sm pr-8 focus:border-primary/40"
            />
            {poll.options.length > 2 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => removeOption(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add option */}
      {poll.options.length < 4 && (
        <button
          onClick={addOption}
          className="w-full h-11 rounded-xl border border-dashed border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add another option
        </button>
      )}

      {/* Duration + remove */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Ends in</span>
          <Select value={poll.duration} onValueChange={(v) => onChange({ ...poll, duration: v })}>
            <SelectTrigger className="h-7 w-auto border-0 bg-transparent p-0 text-xs text-muted-foreground hover:text-foreground focus:ring-0 gap-1 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/50 shadow-lg">
              {DURATION_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="text-sm">{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button onClick={onRemove} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
          Remove poll
        </button>
      </div>
    </div>
  );
}
