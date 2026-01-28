import { useState } from "react";
import { Lock, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFileTypeIcon } from "@/lib/fileTypeIcons";

interface Attachment {
  name: string;
  path?: string;
  size?: number;
}

interface Product {
  attachments: any;
  download_url: string | null;
  pricing_type: string | null;
  original_filename?: string | null;
}

interface AttachmentsSectionProps {
  product: Product;
  isOwner: boolean;
  hasPurchased: boolean;
  isFollowingCreator: boolean;
}

const INITIAL_VISIBLE_COUNT = 3;

export function AttachmentsSection({ 
  product, 
  isOwner, 
  hasPurchased, 
  isFollowingCreator 
}: AttachmentsSectionProps) {
  const [showAll, setShowAll] = useState(false);

  // Build attachments list from attachments array (new format) or legacy download_url
  const attachmentsList: Attachment[] = [];
  
  // Check for new attachments format first
  if (product.attachments && Array.isArray(product.attachments) && product.attachments.length > 0) {
    product.attachments.forEach((att: any) => {
      attachmentsList.push({ 
        name: att.name || 'Attachment', 
        path: att.path,
        size: att.size 
      });
    });
  } else if (product.download_url) {
    // Legacy format: single download_url
    let displayFilename = product.original_filename || null;
    
    if (!displayFilename) {
      const downloadPath = product.download_url;
      const pathParts = downloadPath.split('/');
      const filenamePart = pathParts[pathParts.length - 1];
      
      const timestampMatch = filenamePart.match(/^\d{13,}-(.+)$/);
      if (timestampMatch && timestampMatch[1]) {
        displayFilename = timestampMatch[1];
      } else {
        displayFilename = filenamePart;
      }
    }
    
    attachmentsList.push({ 
      name: displayFilename || 'Download File', 
      path: product.download_url 
    });
  }
  
  if (attachmentsList.length === 0) return null;
  
  const hasAccess = isOwner || hasPurchased || (product.pricing_type === "free" && isFollowingCreator);
  const hasMoreThanInitial = attachmentsList.length > INITIAL_VISIBLE_COUNT;
  const visibleAttachments = showAll 
    ? attachmentsList 
    : attachmentsList.slice(0, INITIAL_VISIBLE_COUNT);
  const hiddenCount = attachmentsList.length - INITIAL_VISIBLE_COUNT;

  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-4 text-foreground">
        Attachments ({attachmentsList.length})
      </h3>
      <div className="flex flex-col gap-2">
        {visibleAttachments.map((attachment, index) => {
          const IconComponent = getFileTypeIcon(attachment.name);
          
          return (
            <div 
              key={index} 
              className="flex items-center gap-3 px-4 py-3 bg-muted/30 rounded-lg border border-border/50"
            >
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                <IconComponent className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground truncate flex-1" title={attachment.name}>
                {attachment.name}
              </span>
              {!hasAccess && (
                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Show more/less toggle */}
      {hasMoreThanInitial && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="mt-3 w-full text-muted-foreground hover:text-foreground"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              Show {hiddenCount} more attachment{hiddenCount > 1 ? 's' : ''}
            </>
          )}
        </Button>
      )}

      {!hasAccess && product.pricing_type !== "free" && (
        <p className="text-xs text-muted-foreground mt-3">
          Purchase to unlock attachments
        </p>
      )}
    </div>
  );
}
