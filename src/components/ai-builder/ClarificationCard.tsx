import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export interface ClarificationQuestion {
  id: string;
  label: string;
  type: 'single' | 'multi';
  options: Array<{ value: string; label: string }>;
}

interface ClarificationCardProps {
  questions: ClarificationQuestion[];
  enhancedPromptSeed?: string;
  onSubmitAnswers: (answers: Record<string, string | string[]>, enhancedPromptSeed?: string) => void;
  onSkip?: () => void;
}

export function ClarificationCard({ 
  questions, 
  enhancedPromptSeed,
  onSubmitAnswers, 
  onSkip 
}: ClarificationCardProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const handleSingleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleMultiAnswer = (questionId: string, value: string, checked: boolean) => {
    setAnswers(prev => {
      const current = (prev[questionId] as string[]) || [];
      if (checked) {
        return { ...prev, [questionId]: [...current, value] };
      } else {
        return { ...prev, [questionId]: current.filter(v => v !== value) };
      }
    });
  };

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-4 mb-6"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/50 flex items-center justify-center">
          <HelpCircle size={14} className="text-violet-400" />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 bg-muted/30 border border-border/50 rounded-2xl rounded-tl-sm p-5 space-y-5">
        <div>
          <p className="text-sm font-medium text-foreground mb-1">A few quick questions</p>
          <p className="text-xs text-muted-foreground">
            Help me tailor this to exactly what you need.
          </p>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="space-y-2"
            >
              <p className="text-sm text-foreground font-medium">{q.label}</p>
              
              {q.type === 'single' ? (
                <RadioGroup
                  value={(answers[q.id] as string) || ''}
                  onValueChange={(val) => handleSingleAnswer(q.id, val)}
                  className="grid gap-1.5"
                >
                  {q.options.map(opt => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <RadioGroupItem value={opt.value} id={`${q.id}-${opt.value}`} />
                      <Label htmlFor={`${q.id}-${opt.value}`} className="text-xs text-muted-foreground cursor-pointer">
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="grid gap-1.5">
                  {q.options.map(opt => {
                    const checked = ((answers[q.id] as string[]) || []).includes(opt.value);
                    return (
                      <div key={opt.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`${q.id}-${opt.value}`}
                          checked={checked}
                          onCheckedChange={(c) => handleMultiAnswer(q.id, opt.value, !!c)}
                        />
                        <Label htmlFor={`${q.id}-${opt.value}`} className="text-xs text-muted-foreground cursor-pointer">
                          {opt.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => onSubmitAnswers(answers, enhancedPromptSeed)}
            disabled={!allAnswered}
            className="text-xs gap-1.5"
          >
            Continue
            <ChevronRight size={12} />
          </Button>
          {onSkip && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-xs text-muted-foreground"
            >
              Skip
            </Button>
          )}
          {answeredCount > 0 && !allAnswered && (
            <span className="text-[10px] text-muted-foreground">
              {answeredCount}/{questions.length} answered
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
