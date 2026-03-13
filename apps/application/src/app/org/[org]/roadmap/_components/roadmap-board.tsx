"use client";

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
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import type { FeedbackStatus } from "@userbubble/db/schema";
import { useState } from "react";
import { toast } from "sonner";
import { getStatus, statuses } from "~/components/feedback/config";
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

  const { data: allPosts } = useSuspenseQuery(
    trpc.feedback.getAll.queryOptions({
      organizationId,
      sortBy: "votes",
    })
  );

  const activePost = allPosts?.find((item) => item.post.id === activeId);

  const updateStatusMutation = useMutation(
    trpc.feedback.updateStatus.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: trpc.feedback.getAll.queryKey({ organizationId }),
        });

        const previousData = queryClient.getQueryData(
          trpc.feedback.getAll.queryKey({ organizationId, sortBy: "votes" })
        );

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
      onError: (_err, _variables, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(
            trpc.feedback.getAll.queryKey({ organizationId, sortBy: "votes" }),
            context.previousData
          );
        }
        toast.error("Failed to update status");
      },
      onSuccess: (_data, variables) => {
        const label = getStatus(variables.status)?.label ?? variables.status;
        toast.success(`Moved to ${label}`);
        void queryClient.invalidateQueries({
          queryKey: trpc.feedback.getAll.queryKey({ organizationId }),
        });
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      return;
    }

    const newStatus = over.id
      .toString()
      .replace("column-", "") as FeedbackStatus;
    const postId = active.id as string;

    const post = allPosts?.find((p) => p.post.id === postId);
    if (!post || post.post.status === newStatus) {
      return;
    }

    updateStatusMutation.mutate({
      postId,
      status: newStatus,
      organizationId,
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      sensors={sensors}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((s) => {
          const posts =
            allPosts?.filter((p) => p.post.status === s.value) ?? [];
          return (
            <RoadmapColumn
              isAuthenticated={isAuthenticated}
              key={s.value}
              org={org}
              organizationId={organizationId}
              posts={posts}
              status={s.value as FeedbackStatus}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeId && activePost ? (
          <div className="rotate-2 cursor-grabbing opacity-90 shadow-2xl">
            <RoadmapCard
              author={activePost.author ?? null}
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
