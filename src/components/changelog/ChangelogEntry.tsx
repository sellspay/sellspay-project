import React from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { CATEGORY_LABELS, VERSION_TYPE_LABELS } from "@/lib/versioning";
import { Badge } from "@/components/ui/badge";

interface ChangelogEntryProps {
  id: string;
  title: string;
  content: string;
  category: string;
  versionNumber?: string | null;
  versionType?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  featureTags?: string[] | null;
  createdAt: string;
  isPinned?: boolean;
}

export function ChangelogEntry({
  title,
  content,
  category,
  versionNumber,
  versionType,
  mediaUrl,
  mediaType,
  featureTags,
  createdAt,
  isPinned,
}: ChangelogEntryProps) {
  const categoryConfig = CATEGORY_LABELS[category] || CATEGORY_LABELS.announcement;
  const versionConfig = versionType ? VERSION_TYPE_LABELS[versionType] : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative pl-8 pb-12 last:pb-0"
    >
      {/* Timeline connector dot */}
      <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />

      {/* Card */}
      <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors">
        {/* Header with version and badges */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {versionNumber && (
            <span className="text-lg font-mono font-bold text-primary">
              v{versionNumber}
            </span>
          )}
          
          <Badge variant="secondary" className={`${categoryConfig.color} text-white`}>
            {categoryConfig.label}
          </Badge>

          {versionConfig && (
            <Badge variant="outline" className="text-xs">
              {versionConfig.label} Release
            </Badge>
          )}

          {isPinned && (
            <Badge variant="outline" className="text-amber-500 border-amber-500/30">
              📌 Pinned
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>

        {/* Content */}
        <p className="text-muted-foreground leading-relaxed mb-4">{content}</p>

        {/* Feature Tags */}
        {featureTags && featureTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {featureTags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Media Preview */}
        {mediaUrl && (
          <div className="relative rounded-xl overflow-hidden border border-border mb-4">
            {mediaType === "video" ? (
              <video
                src={mediaUrl}
                controls
                className="w-full max-h-80 object-cover"
              />
            ) : (
              <img
                src={mediaUrl}
                alt={title}
                className="w-full max-h-80 object-cover"
              />
            )}
          </div>
        )}

        {/* Footer with timestamp */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <time className="text-sm text-muted-foreground">
            {new Date(createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          
          {mediaUrl && (
            <a
              href={mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View Full <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default ChangelogEntry;
