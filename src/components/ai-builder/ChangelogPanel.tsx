import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ExternalLink, X } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CATEGORY_LABELS } from "@/lib/versioning";

interface ChangelogPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangelogPanel({ open, onOpenChange }: ChangelogPanelProps) {
  const { data: updates, isLoading } = useQuery({
    queryKey: ["changelog-panel-updates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_updates")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data ?? [];
    },
    enabled: open, // Only fetch when panel is open
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[450px] bg-zinc-950 border-zinc-800">
        <SheetHeader className="pb-4 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary" size={20} />
              <SheetTitle className="text-zinc-100">What's New</SheetTitle>
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X size={16} />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)] mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-zinc-900 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : updates && updates.length > 0 ? (
            <div className="space-y-4 pr-4">
              {updates.map((update) => {
                const categoryConfig =
                  CATEGORY_LABELS[update.category] || CATEGORY_LABELS.announcement;

                return (
                  <article
                    key={update.id}
                    className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {update.version_number && (
                        <span className="text-sm font-mono font-bold text-primary">
                          v{update.version_number}
                        </span>
                      )}
                      <Badge
                        variant="secondary"
                        className={`${categoryConfig.color} text-white text-xs`}
                      >
                        {categoryConfig.label}
                      </Badge>
                    </div>

                    <h4 className="font-semibold text-zinc-100 mb-1">
                      {update.title}
                    </h4>

                    <p className="text-sm text-zinc-400 line-clamp-2">
                      {update.content}
                    </p>

                    <time className="text-xs text-zinc-500 mt-2 block">
                      {new Date(update.created_at ?? "").toLocaleDateString()}
                    </time>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500">
              <p>No updates yet.</p>
            </div>
          )}
        </ScrollArea>

        {/* Footer with link to full changelog */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800 bg-zinc-950">
          <Link to="/changelog" onClick={() => onOpenChange(false)}>
            <Button variant="outline" className="w-full gap-2">
              View Full Changelog
              <ExternalLink size={14} />
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default ChangelogPanel;
