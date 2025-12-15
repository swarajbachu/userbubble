"use client";

import { Message01Icon } from "@hugeicons-pro/core-bulk-rounded";
import type { FeedbackComment, User } from "@userbubble/db/schema";
import {
  DoubleCard,
  DoubleCardHeader,
  DoubleCardInner,
} from "@userbubble/ui/double-card";
import { Icon } from "@userbubble/ui/icon";
import { useState } from "react";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";

type CommentsSectionProps = {
  postId: string;
  initialComments: Array<{
    comment: FeedbackComment;
    author: User | null;
    isTeamMember: boolean;
  }>;
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
    <DoubleCard>
      <DoubleCardHeader>
        <h2 className="font-semibold text-lg">Comments ({comments.length})</h2>
      </DoubleCardHeader>

      <DoubleCardInner className="p-6">
        {/* Comment form (for authenticated users) */}
        {isAuthenticated && (
          <div className="mb-8">
            <CommentForm
              onCommentAdded={(newComment) => {
                // Optimistically add to list
                setComments([newComment, ...comments]);
              }}
              postId={postId}
            />
          </div>
        )}

        {/* Comments list */}
        <div className="space-y-2 divide-y rounded-2xl border">
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
              <div className="px-4 py-2" key={item.comment.id}>
                <CommentItem
                  author={item.author}
                  canDelete={userId === item.comment.authorId}
                  comment={item.comment}
                  isTeamMember={item.isTeamMember}
                  onDeleted={() => {
                    // Remove from list
                    setComments(
                      comments.filter((c) => c.comment.id !== item.comment.id)
                    );
                  }}
                />
              </div>
            ))
          )}
        </div>
      </DoubleCardInner>
    </DoubleCard>
  );
}
