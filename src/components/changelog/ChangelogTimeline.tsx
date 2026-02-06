import React, { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ChangelogEntry } from "./ChangelogEntry";

interface Update {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  is_pinned?: boolean | null;
  version_number?: string | null;
  version_type?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  feature_tags?: string[] | null;
}

interface ChangelogTimelineProps {
  updates: Update[];
  className?: string;
}

interface MonthGroup {
  label: string;
  entries: Update[];
}

export function ChangelogTimeline({ updates, className = "" }: ChangelogTimelineProps) {
  // Group updates by month/year
  const groupedUpdates = useMemo(() => {
    const groups: Map<string, Update[]> = new Map();

    // Sort by date descending
    const sorted = [...updates].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    sorted.forEach((update) => {
      const date = parseISO(update.created_at);
      const key = format(date, "MMMM yyyy");
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(update);
    });

    // Convert to array of { label, entries }
    const result: MonthGroup[] = [];
    groups.forEach((entries, label) => {
      result.push({ label, entries });
    });

    return result;
  }, [updates]);

  if (updates.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg">No updates yet.</p>
        <p className="text-sm">Check back soon for the latest changes!</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Vertical spine line */}
      <div className="absolute left-[5px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-border to-transparent" />

      {groupedUpdates.map((group) => (
        <section key={group.label} className="mb-12">
          {/* Month/Year sticky header */}
          <div className="sticky top-20 z-10 bg-background/95 backdrop-blur-sm py-3 mb-6">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              {group.label}
            </h2>
            <div className="h-0.5 w-16 bg-primary mt-2" />
          </div>

          {/* Entries for this month */}
          <div className="space-y-0">
            {group.entries.map((entry) => (
              <ChangelogEntry
                key={entry.id}
                id={entry.id}
                title={entry.title}
                content={entry.content}
                category={entry.category}
                versionNumber={entry.version_number}
                versionType={entry.version_type}
                mediaUrl={entry.media_url}
                mediaType={entry.media_type}
                featureTags={entry.feature_tags}
                createdAt={entry.created_at}
                isPinned={entry.is_pinned ?? false}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default ChangelogTimeline;
