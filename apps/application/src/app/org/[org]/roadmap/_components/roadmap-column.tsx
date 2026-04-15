"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { FeedbackPost, FeedbackStatus } from "@userbubble/db/schema";
import { cn } from "@userbubble/ui";
import { getStatus } from "~/components/feedback/config";
import { RoadmapCard } from "./roadmap-card";

type RoadmapColumnProps = {
  posts: Array<{
    post: FeedbackPost;
    author: { name: string | null; image: string | null } | null;
    hasUserVoted: boolean;
  }>;
  org: string;
  organizationId: string;
  status: FeedbackStatus;
  isAuthenticated?: boolean;
};

export function RoadmapColumn({
  posts,
  org,
  organizationId,
  status,
  isAuthenticated,
}: RoadmapColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
  });

  const postIds = posts.map((item) => item.post.id);
  const config = getStatus(status);

  return (
    <div className="flex w-[280px] shrink-0 flex-col">
      {/* Compact column header */}
      <div className="mb-3 flex items-center gap-2">
        {config && (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-xs",
              config.color
                .replace("text-", "bg-")
                .replace("-500", "-500/15")
                .replace("-400", "-400/15"),
              config.color
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                config.color.replace("text-", "bg-")
              )}
            />
            {config.label}
          </span>
        )}
        <span className="text-muted-foreground text-xs">{posts.length}</span>
      </div>

      {/* Droppable area */}
      <div
        className={cn(
          "flex-1 space-y-2 rounded-lg border border-transparent p-1 transition-colors",
          isOver && "border-primary/30 bg-primary/5"
        )}
        ref={setNodeRef}
      >
        <SortableContext items={postIds} strategy={verticalListSortingStrategy}>
          {posts.length === 0 ? (
            <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed p-4">
              <span className="text-muted-foreground/50 text-xs">No items</span>
            </div>
          ) : (
            posts.map((item) => (
              <RoadmapCard
                author={item.author}
                hasUserVoted={item.hasUserVoted}
                isAuthenticated={isAuthenticated}
                key={item.post.id}
                org={org}
                organizationId={organizationId}
                post={item.post}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
