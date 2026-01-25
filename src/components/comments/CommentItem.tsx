import { useState } from "react";
import { Heart, Reply, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommentUser {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  verified: boolean | null;
}

interface CommentLike {
  id: string;
  user_id: string;
  user?: CommentUser | null;
}

interface Comment {
  id: string;
  content: string;
  gif_url: string | null;
  created_at: string;
  user_id: string;
  parent_comment_id: string | null;
  user: CommentUser | null;
  likes: CommentLike[];
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  creatorId: string | null;
  currentUserProfileId: string | null;
  onLike: (commentId: string) => void;
  onReply: (commentId: string) => void;
  isLiking: boolean;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  creatorId,
  currentUserProfileId,
  onLike,
  onReply,
  isLiking,
  isReply = false,
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);

  const isLikedByUser = comment.likes.some(
    (like) => like.user_id === currentUserProfileId
  );

  const creatorLike = comment.likes.find((like) => like.user_id === creatorId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className={cn("flex gap-3", isReply && "ml-10")}>
      <Link to={comment.user?.username ? `/@${comment.user.username}` : '#'}>
        <Avatar className="w-8 h-8 flex-shrink-0 hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
          <AvatarImage src={comment.user?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {comment.user?.username?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link 
            to={comment.user?.username ? `/@${comment.user.username}` : '#'}
            className="text-sm font-medium flex items-center gap-1 hover:text-primary transition-colors"
          >
            @{comment.user?.username || "anonymous"}
            {comment.user?.verified && (
              <BadgeCheck className="w-3 h-3 text-primary" />
            )}
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatDate(comment.created_at)}
          </span>
        </div>

        {/* Comment content */}
        {comment.content && (
          <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
        )}

        {/* GIF content */}
        {comment.gif_url && (
          <div className="mt-2 rounded-lg overflow-hidden max-w-xs">
            <img
              src={comment.gif_url}
              alt="GIF"
              className="max-w-full h-auto"
              loading="lazy"
            />
          </div>
        )}

        {/* Actions row */}
        <div className="flex items-center gap-3 mt-2">
          {/* Like button with count */}
          <button
            onClick={() => onLike(comment.id)}
            disabled={isLiking}
            className={cn(
              "flex items-center gap-1 text-xs transition-colors",
              isLikedByUser
                ? "text-destructive"
                : "text-muted-foreground hover:text-destructive"
            )}
          >
            {isLiking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Heart
                className={cn("w-3.5 h-3.5", isLikedByUser && "fill-current")}
              />
            )}
            {comment.likes.length > 0 && (
              <span>{comment.likes.length}</span>
            )}
          </button>

          {/* Creator liked indicator */}
          {creatorLike && creatorLike.user && (
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-destructive fill-destructive" />
              <Avatar className="w-4 h-4 border border-destructive">
                <AvatarImage src={creatorLike.user.avatar_url || undefined} />
                <AvatarFallback className="text-[8px]">
                  {creatorLike.user.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          {/* Reply button (only for top-level comments) */}
          {!isReply && (
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Reply className="w-3.5 h-3.5" />
              Reply
            </button>
          )}
        </div>

        {/* Replies */}
        {!isReply && comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {showReplies ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Hide replies
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  View {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
                </>
              )}
            </button>

            {showReplies && (
              <div className="mt-2 space-y-3">
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    creatorId={creatorId}
                    currentUserProfileId={currentUserProfileId}
                    onLike={onLike}
                    onReply={onReply}
                    isLiking={isLiking}
                    isReply
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
