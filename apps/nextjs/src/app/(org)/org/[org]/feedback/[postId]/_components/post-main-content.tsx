"use client";

import { Button } from "@critichut/ui/button";
import { Icon } from "@critichut/ui/icon";
import { PencilEdit01Icon } from "@hugeicons-pro/core-bulk-rounded";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import { VoteSection } from "./vote-section";

type PostMainContentProps = {
  postId: string;
  initialTitle: string;
  initialDescription: string;
  initialVoteCount: number;
  hasUserVoted: boolean;
  isAuthenticated: boolean;
  canModify: boolean;
  authorName: string;
  createdAt: Date;
};

export function PostMainContent({
  postId,
  initialTitle,
  initialDescription,
  initialVoteCount,
  hasUserVoted,
  isAuthenticated,
  canModify,
  authorName,
  createdAt,
}: PostMainContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updatePost = useMutation(
    trpc.feedback.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.feedback.getById.queryKey({ id: postId }),
        });
        toast.success("Post updated");
        setIsEditing(false);
        router.refresh();
      },
      onError: () => {
        toast.error("Failed to update post");
      },
    })
  );

  const form = useForm({
    defaultValues: {
      title: initialTitle,
      description: initialDescription,
    },
    onSubmit: async ({ value }) => {
      await updatePost.mutateAsync({
        id: postId,
        ...value,
      });
    },
  });

  if (isEditing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="flex items-start gap-4">
          <div className="pt-1">
            <VoteSection
              hasUserVoted={hasUserVoted}
              initialVoteCount={initialVoteCount}
              isAuthenticated={isAuthenticated}
              postId={postId}
            />
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div className="space-y-2">
              <form.Field name="title">
                {(field) => (
                  <input
                    autoFocus
                    className="w-full bg-transparent p-0 font-semibold text-2xl text-foreground tracking-tight placeholder:text-muted-foreground focus:outline-none focus:ring-0 sm:text-3xl"
                    maxLength={256}
                    minLength={3}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Post title"
                    required
                    value={field.state.value}
                  />
                )}
              </form.Field>

              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <span className="font-medium text-foreground/80">
                  {authorName}
                </span>
                <span>•</span>
                <span>
                  {createdAt.toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <form.Field name="description">
              {(field) => (
                <textarea
                  className="min-h-[200px] w-full resize-none bg-transparent p-0 text-foreground/90 leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                  maxLength={5000}
                  minLength={10}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Post description"
                  required
                  value={field.state.value}
                />
              )}
            </form.Field>

            <div className="flex items-center gap-2 pt-2">
              <Button disabled={updatePost.isPending} size="sm" type="submit">
                {updatePost.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                disabled={updatePost.isPending}
                onClick={() => setIsEditing(false)}
                size="sm"
                type="button"
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="pt-1">
          <VoteSection
            hasUserVoted={hasUserVoted}
            initialVoteCount={initialVoteCount}
            isAuthenticated={isAuthenticated}
            postId={postId}
          />
        </div>
        <div className="group min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <h1 className="wrap-break-word font-semibold text-2xl text-foreground tracking-tight sm:text-3xl">
              {initialTitle}
            </h1>
            {canModify && (
              <Button
                className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => setIsEditing(true)}
                size="sm"
                variant="ghost"
              >
                <Icon icon={PencilEdit01Icon} size={16} />
                Edit
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span className="font-medium text-foreground/80">{authorName}</span>
            <span>•</span>
            <span>
              {createdAt.toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
          {initialDescription}
        </p>
      </div>
    </div>
  );
}
