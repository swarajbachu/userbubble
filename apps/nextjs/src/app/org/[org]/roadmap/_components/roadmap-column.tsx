"use client";

import type { FeedbackPost } from "@critichut/db/schema";
import { cn } from "@critichut/ui";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { HugeiconsIcon } from "@hugeicons/react";
import { InboxIcon } from "@hugeicons-pro/core-bulk-rounded";
import type { ComponentProps } from "react";
import { RoadmapCard } from "./roadmap-card";

type RoadmapColumnProps = {
  title: string;
  description: string;
  posts: Array<{
    post: FeedbackPost;
    author: { name: string | null; image: string | null } | null;
    hasUserVoted: boolean;
  }>;
  org: string;
  organizationId: string;
  icon: ComponentProps<typeof HugeiconsIcon>["icon"];
  color: string;
  status: "planned" | "in_progress" | "completed";
  isAuthenticated?: boolean;
};

export function RoadmapColumn({
  title,
  description,
  posts,
  org,
  organizationId,
  icon,
  status,
  isAuthenticated,
}: RoadmapColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
  });

  const postIds = posts.map((item) => item.post.id);

  // Color mappings for enhanced styling
  const colorClasses = {
    planned: {
      bg: "bg-purple-500/10",
      icon: "text-purple-600",
      border: "border-purple-500/30",
    },
    in_progress: {
      bg: "bg-orange-500/10",
      icon: "text-orange-600",
      border: "border-orange-500/30",
    },
    completed: {
      bg: "bg-emerald-500/10",
      icon: "text-emerald-600",
      border: "border-emerald-500/30",
    },
  };

  const emptyMessages = {
    planned: "Items added here will appear in the roadmap",
    in_progress: "Move items here when work begins",
    completed: "Completed items will appear here",
  };

  const colors = colorClasses[status];

  return (
    <div className="flex h-full flex-col">
      {/* Enhanced column header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className={cn("rounded-lg p-2", colors.bg)}>
              <HugeiconsIcon
                className={cn("size-6", colors.icon)}
                icon={icon}
              />
            </div>
            <h2 className="font-bold text-xl tracking-tight">{title}</h2>
            <span className="rounded-full bg-muted px-3 py-1 font-semibold text-sm">
              {posts.length}
            </span>
          </div>
          <p className="ml-14 text-muted-foreground text-sm">{description}</p>
        </div>
      </div>

      {/* Droppable area with visual feedback */}
      <div
        className={cn(
          "flex-1 space-y-3 rounded-xl border-2 p-4 transition-all",
          "bg-muted/30",
          isOver && [
            "border-primary border-dashed bg-primary/5",
            colors.border,
          ],
          !isOver && "border-transparent"
        )}
        ref={setNodeRef}
      >
        <SortableContext items={postIds} strategy={verticalListSortingStrategy}>
          {posts.length === 0 ? (
            // Enhanced empty state
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center">
              <div className="rounded-full bg-muted p-4">
                <HugeiconsIcon
                  className="size-8 text-muted-foreground/50"
                  icon={InboxIcon}
                />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">No items yet</p>
                <p className="text-muted-foreground text-xs">
                  {emptyMessages[status]}
                </p>
              </div>
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
