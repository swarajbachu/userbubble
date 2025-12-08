"use client";

import type { FeedbackStatus } from "@critichut/db/schema";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  CheckmarkBadge01Icon,
  Clock01Icon,
  HourglassIcon,
} from "@hugeicons-pro/core-bulk-rounded";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import { RoadmapCard } from "./roadmap-card";
import { RoadmapColumn } from "./roadmap-column";

type RoadmapBoardProps = {
  org: string;
  organizationId: string;
  isAuthenticated?: boolean;
};

export function RoadmapBoard({
  org,
  organizationId,
  isAuthenticated,
}: RoadmapBoardProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Fetch all posts
  const { data: allPosts } = useSuspenseQuery(
    trpc.feedback.getAll.queryOptions({
      organizationId,
      sortBy: "votes",
    })
  );

  // Filter by status
  const plannedPosts =
    allPosts?.filter((post) => post.post.status === "planned") ?? [];
  const inProgressPosts =
    allPosts?.filter((post) => post.post.status === "in_progress") ?? [];
  const completedPosts =
    allPosts?.filter((post) => post.post.status === "completed") ?? [];

  // Find active card for overlay
  const activePost = allPosts?.find((item) => item.post.id === activeId);

  // Status update mutation with optimistic updates
  const updateStatusMutation = useMutation(
    trpc.feedback.updateStatus.mutationOptions({
      onMutate: async (variables) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({
          queryKey: trpc.feedback.getAll.queryKey({ organizationId }),
        });

        // Snapshot previous value
        const previousData = queryClient.getQueryData(
          trpc.feedback.getAll.queryKey({ organizationId, sortBy: "votes" })
        );

        // Optimistically update
        queryClient.setQueryData(
          trpc.feedback.getAll.queryKey({ organizationId, sortBy: "votes" }),
          (old) => {
            if (!old) {
              return old;
            }
            return old.map((item) =>
              item.post.id === variables.postId
                ? { ...item, post: { ...item.post, status: variables.status } }
                : item
            );
          }
        );

        return { previousData };
      },
      onError: (err, _variables, context) => {
        // Rollback on error
        if (context?.previousData) {
          queryClient.setQueryData(
            trpc.feedback.getAll.queryKey({ organizationId, sortBy: "votes" }),
            context.previousData
          );
        }
        toast.error("Failed to update status", {
          description: err.message,
        });
      },
      onSuccess: (_data, variables) => {
        const statusLabels: Record<FeedbackStatus, string> = {
          planned: "Planned",
          in_progress: "In Progress",
          completed: "Completed",
          open: "Open",
          under_review: "Under Review",
          closed: "Closed",
        };
        toast.success(`Moved to ${statusLabels[variables.status]}`);

        // Invalidate to ensure sync
        void queryClient.invalidateQueries({
          queryKey: trpc.feedback.getAll.queryKey({ organizationId }),
        });
      },
    })
  );

  // Drag event handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      return;
    }

    // Extract status from column ID (e.g., "column-planned" -> "planned")
    const newStatus = over.id.toString().replace("column-", "") as
      | "planned"
      | "in_progress"
      | "completed";
    const postId = active.id as string;

    // Get current post data
    const post = allPosts?.find((p) => p.post.id === postId);
    if (!post || post.post.status === newStatus) {
      return;
    }

    // Trigger mutation with optimistic update
    updateStatusMutation.mutate({
      postId,
      status: newStatus,
      organizationId,
    });
  };

  // Setup sensors for drag activation
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor)
  );

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      sensors={sensors}
    >
      <div className="grid gap-6 md:grid-cols-3">
        <RoadmapColumn
          color="text-purple-500"
          description="Features we're planning to build"
          icon={Clock01Icon}
          isAuthenticated={isAuthenticated}
          org={org}
          organizationId={organizationId}
          posts={plannedPosts}
          status="planned"
          title="Planned"
        />

        <RoadmapColumn
          color="text-orange-500"
          description="Currently being worked on"
          icon={HourglassIcon}
          isAuthenticated={isAuthenticated}
          org={org}
          organizationId={organizationId}
          posts={inProgressPosts}
          status="in_progress"
          title="In Progress"
        />

        <RoadmapColumn
          color="text-green-500"
          description="Recently shipped features"
          icon={CheckmarkBadge01Icon}
          isAuthenticated={isAuthenticated}
          org={org}
          organizationId={organizationId}
          posts={completedPosts}
          status="completed"
          title="Completed"
        />
      </div>

      {/* Ghost element during drag */}
      <DragOverlay>
        {activeId && activePost ? (
          <div className="rotate-2 cursor-grabbing opacity-90 shadow-2xl">
            <RoadmapCard
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              author={activePost.author!}
              hasUserVoted={activePost.hasUserVoted}
              isAuthenticated={isAuthenticated}
              isDragging
              org={org}
              organizationId={organizationId}
              post={activePost.post}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
