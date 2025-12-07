"use client";

import type { FeedbackComment, User } from "@critichut/db/schema";
import { Icon } from "@critichut/ui/icon";
import { Message01Icon } from "@hugeicons-pro/core-bulk-rounded";
import { useState } from "react";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";

type CommentsSectionProps = {
  postId: string;
  initialComments: Array<{ comment: FeedbackComment; author: User | null }>;
  isAuthenticated: boolean;
  userId: string | undefined;
  organizationId: string;
};

export function CommentsSection({
  postId,
  initialComments,
  isAuthenticated,
  userId,
}: CommentsSectionProps) {
  const [comments, setComments] = useState(initialComments);

  return (
    <div className="mt-12">
      <h2 className="mb-6 font-semibold text-xl">
        Comments ({comments.length})
      </h2>

      {/* Comment form (for authenticated users) */}
      {isAuthenticated && (
        <CommentForm
          onCommentAdded={(newComment) => {
            // Optimistically add to list
            setComments([newComment, ...comments]);
          }}
          postId={postId}
        />
      )}

      {/* Comments list */}
      <div className="mt-6 space-y-4">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <Icon
              className="text-muted-foreground"
              icon={Message01Icon}
              size={32}
            />
            <p className="mt-2 text-muted-foreground text-sm">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          comments.map((item) => (
            <CommentItem
              author={item.author}
              canDelete={userId === item.comment.authorId}
              comment={item.comment}
              key={item.comment.id}
              onDeleted={() => {
                // Remove from list
                setComments(
                  comments.filter((c) => c.comment.id !== item.comment.id)
                );
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
