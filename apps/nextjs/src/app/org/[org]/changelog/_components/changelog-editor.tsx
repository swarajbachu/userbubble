"use client";

import type { getChangelogEntry } from "@critichut/db/queries";
import { Button } from "@critichut/ui/button";
import { Icon } from "@critichut/ui/icon";
import {
  ArrowLeft01Icon,
  Delete02Icon,
  Rocket01Icon,
} from "@hugeicons-pro/core-bulk-rounded";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";
import { ChangelogEditorForm } from "./changelog-editor-form";
import { ChangelogEditorPreview } from "./changelog-editor-preview";
import { DeleteChangelogDialog } from "./delete-changelog-dialog";
import { useChangelogForm } from "./use-changelog-form";
import { useChangelogMutations } from "./use-changelog-mutations";

type ChangelogEntry = Awaited<ReturnType<typeof getChangelogEntry>>;

type ChangelogEditorProps = {
  mode: "create" | "edit";
  org: string;
  organizationId: string;
  entry?: ChangelogEntry;
};

export function ChangelogEditor({
  mode,
  org,
  organizationId,
  entry,
}: ChangelogEditorProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch all completed feedback posts to map IDs to details
  // This is efficient because it uses the same query key as the selector
  const { data: feedbackPosts } = useSuspenseQuery(
    trpc.feedback.getAll.queryOptions({
      organizationId,
      status: ["completed"],
    })
  );

  const {
    createMutation,
    updateMutation,
    publishMutation,
    deleteMutation,
    isPending,
  } = useChangelogMutations({
    organizationId,
    orgSlug: org,
  });

  const form = useChangelogForm({
    entry,
    onSubmit: async (values) => {
      if (mode === "edit" && entry) {
        await updateMutation.mutateAsync({
          id: entry.id,
          title: values.title,
          description: values.description,
          version: values.version || undefined,
          coverImageUrl: values.coverImageUrl || undefined,
          tags: values.tags.length > 0 ? values.tags : undefined,
        });
      } else {
        await createMutation.mutateAsync({
          organizationId,
          title: values.title,
          description: values.description,
          version: values.version || undefined,
          coverImageUrl: values.coverImageUrl || undefined,
          tags: values.tags.length > 0 ? values.tags : undefined,
          feedbackPostIds:
            values.feedbackPostIds.length > 0
              ? values.feedbackPostIds
              : undefined,
          isPublished: false,
        });
      }
    },
  });

  // Watch form state for real-time preview
  const currentValues = form.state.values;

  // Map selected IDs to feedback objects
  const selectedFeedback = currentValues.feedbackPostIds
    .map((id: string) => {
      const post = feedbackPosts.find((p) => p.post.id === id);
      return post ? { id: post.post.id, title: post.post.title } : null;
    })
    .filter(
      (
        p: { id: string; title: string } | null
      ): p is { id: string; title: string } => p !== null
    );

  const handlePublish = async () => {
    if (mode === "edit" && entry) {
      publishMutation.mutate({ id: entry.id });
    } else {
      const values = currentValues;
      await createMutation.mutateAsync({
        organizationId,
        title: values.title,
        description: values.description,
        version: values.version || undefined,
        coverImageUrl: values.coverImageUrl || undefined,
        tags: values.tags.length > 0 ? values.tags : undefined,
        feedbackPostIds:
          values.feedbackPostIds.length > 0
            ? values.feedbackPostIds
            : undefined,
        isPublished: true,
      });
    }
  };

  const handleDelete = () => {
    if (mode === "edit" && entry) {
      deleteMutation.mutate({ id: entry.id });
    }
  };

  const handleCancel = () => {
    router.push(`/org/${org}/changelog`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Action Bar */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              className="-ml-2 text-muted-foreground hover:text-foreground"
              onClick={handleCancel}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Icon icon={ArrowLeft01Icon} size={16} />
              <span className="sr-only sm:not-sr-only sm:inline-block">
                Back
              </span>
            </Button>
            <div className="h-4 w-px bg-border/50" />
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-sm">
                {mode === "create" ? "New Entry" : "Edit Entry"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === "edit" && entry && (
              <Button
                className="text-muted-foreground hover:text-destructive"
                disabled={isPending}
                onClick={() => setShowDeleteDialog(true)}
                size="sm"
                variant="ghost"
              >
                <Icon icon={Delete02Icon} size={16} />
              </Button>
            )}

            <div className="flex items-center gap-2 rounded-lg border bg-background p-1">
              <Button
                className="h-7 px-3 text-xs"
                disabled={isPending}
                onClick={() => form.handleSubmit()}
                size="sm"
                variant="ghost"
              >
                {isPending ? "Saving..." : "Save Draft"}
              </Button>
              <div className="h-4 w-px bg-border" />
              <Button
                className="h-7 gap-1.5 px-3 text-xs shadow-none"
                disabled={isPending || entry?.isPublished}
                onClick={handlePublish}
                size="sm"
                variant="default"
              >
                <Icon icon={Rocket01Icon} size={14} />
                {isPending ? "Publishing..." : "Publish"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Editor Content */}
      <main className="flex-1">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-12 px-6 py-8 lg:grid-cols-2">
          {/* Left Panel - Form */}
          <div className="lg:sticky lg:top-24 lg:self-start lg:pr-8">
            <ChangelogEditorForm form={form} organizationId={organizationId} />
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:sticky lg:top-24 lg:self-start lg:border-border/60 lg:border-l lg:border-dashed lg:pl-8">
            <ChangelogEditorPreview
              coverImageUrl={currentValues.coverImageUrl}
              description={currentValues.description}
              linkedFeedback={selectedFeedback}
              org={org}
              tags={currentValues.tags}
              title={currentValues.title}
              version={currentValues.version}
            />
          </div>
        </div>
      </main>

      <DeleteChangelogDialog
        isPending={deleteMutation.isPending}
        onConfirm={handleDelete}
        onOpenChange={setShowDeleteDialog}
        open={showDeleteDialog}
      />
    </div>
  );
}
