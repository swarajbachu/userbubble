"use client";

import {
  ArrowLeft01Icon,
  Clock01Icon,
  Delete02Icon,
  Rocket01Icon,
  TextIcon,
} from "@hugeicons-pro/core-bulk-rounded";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { getChangelogEntry } from "@userbubble/db/queries";
import { Button } from "@userbubble/ui/button";
import { Icon } from "@userbubble/ui/icon";
import { Input } from "@userbubble/ui/input";
import { TiptapEditor } from "@userbubble/ui/tiptap-editor";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";
import { ChangelogTagSelector } from "./changelog-tag-selector";
import { DeleteChangelogDialog } from "./delete-changelog-dialog";
import { FeedbackSelector } from "./feedback-selector";
import {
  type ChangelogFormValues,
  useChangelogForm,
} from "./use-changelog-form";
import { useChangelogMutations } from "./use-changelog-mutations";

type ChangelogEntry = Awaited<ReturnType<typeof getChangelogEntry>>;

type ChangelogEditorProps = {
  mode: "create" | "edit";
  org: string;
  organizationId: string;
  entry?: ChangelogEntry;
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

const WHITESPACE_RE = /\s+/;

function countWords(text: string): number {
  const cleaned = stripHtml(text).trim();
  if (!cleaned) {
    return 0;
  }
  return cleaned.split(WHITESPACE_RE).length;
}

function readingTime(words: number): string {
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

export function ChangelogEditor({
  mode,
  org,
  organizationId,
  entry,
}: ChangelogEditorProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [previewValues, setPreviewValues] = useState<ChangelogFormValues>({
    title: entry?.title ?? "",
    description: entry?.description ?? "",
    version: entry?.version ?? "",
    coverImageUrl: entry?.coverImageUrl ?? "",
    tags: (entry?.tags as string[]) ?? [],
    feedbackPostIds: entry?.linkedFeedback?.map((f) => f.id) ?? [],
  });

  useSuspenseQuery(
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
          organizationId,
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
    onValuesChange: setPreviewValues,
  });

  const handlePublish = async () => {
    if (mode === "edit" && entry) {
      publishMutation.mutate({ organizationId, id: entry.id });
    } else {
      const values = previewValues;
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
      deleteMutation.mutate({ organizationId, id: entry.id });
    }
  };

  const handleCancel = () => {
    router.push(`/org/${org}/changelog`);
  };

  const wordCount = countWords(previewValues.description);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* Top bar */}
      <header className="-mx-6 -mt-6 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Button
              className="size-8 text-muted-foreground"
              onClick={handleCancel}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Icon icon={ArrowLeft01Icon} size={16} />
            </Button>
            <div className="h-4 w-px bg-border/50" />
            <span className="font-medium text-sm">
              {mode === "create" ? "New Entry" : "Edit Entry"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {mode === "edit" && entry && (
              <Button
                className="size-8 text-muted-foreground hover:text-destructive"
                disabled={isPending}
                onClick={() => setShowDeleteDialog(true)}
                size="icon"
                variant="ghost"
              >
                <Icon icon={Delete02Icon} size={16} />
              </Button>
            )}

            <Button
              className="h-8 px-3 text-xs"
              disabled={isPending}
              onClick={() => form.handleSubmit()}
              size="sm"
              variant="outline"
            >
              {isPending ? "Saving..." : "Save Draft"}
            </Button>

            <Button
              className="h-8 gap-1.5 px-3 text-xs"
              disabled={isPending || entry?.isPublished}
              onClick={handlePublish}
              size="sm"
            >
              <Icon icon={Rocket01Icon} size={14} />
              {isPending ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main editor area */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10">
        {/* Categories */}
        <form.Field name="tags">
          {(field) => (
            <div className="mb-4">
              <ChangelogTagSelector
                onChange={field.handleChange}
                value={field.state.value}
              />
            </div>
          )}
        </form.Field>

        {/* Title */}
        <form.Field name="title">
          {(field) => (
            <input
              autoFocus
              className="w-full bg-transparent font-bold text-3xl outline-none placeholder:text-muted-foreground/40"
              maxLength={256}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Enter a title"
              value={field.state.value}
            />
          )}
        </form.Field>

        {/* Version */}
        <form.Field name="version">
          {(field) => (
            <input
              className="mt-2 w-full bg-transparent text-muted-foreground text-sm outline-none placeholder:text-muted-foreground/30"
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Version (e.g. 1.0.0)"
              value={field.state.value}
            />
          )}
        </form.Field>

        {/* Divider */}
        <div className="my-6 h-px bg-border/50" />

        {/* Rich text editor — inline variant with floating toolbar */}
        <form.Field name="description">
          {(field) => (
            <div className="flex-1">
              <TiptapEditor
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                value={field.state.value}
                variant="inline"
              />
            </div>
          )}
        </form.Field>

        {/* Cover image + feedback — collapsible section at bottom */}
        <div className="mt-8 space-y-4 border-t pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="coverImageUrl">
              {(field) => (
                <div className="space-y-1.5">
                  <span className="font-medium text-muted-foreground text-xs">
                    Cover Image
                  </span>
                  <Input
                    aria-label="Cover Image URL"
                    className="h-8 text-sm"
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="https://..."
                    type="url"
                    value={field.state.value}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="feedbackPostIds">
              {(field) => (
                <div className="space-y-1.5">
                  <span className="font-medium text-muted-foreground text-xs">
                    Related Feedback
                  </span>
                  <FeedbackSelector
                    onValueChange={field.handleChange}
                    organizationId={organizationId}
                    value={field.state.value as string[]}
                  />
                </div>
              )}
            </form.Field>
          </div>
        </div>
      </main>

      {/* Floating bottom stats bar */}
      <footer className="border-t bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2 text-muted-foreground text-xs">
          <span className="flex items-center gap-1">
            <Icon icon={TextIcon} size={12} />
            {wordCount} words
          </span>
          <span className="text-border">&middot;</span>
          <span className="flex items-center gap-1">
            <Icon icon={Clock01Icon} size={12} />
            {readingTime(wordCount)}
          </span>
          {previewValues.tags.length > 0 && (
            <>
              <span className="text-border">&middot;</span>
              <span>
                {previewValues.tags.length}{" "}
                {previewValues.tags.length === 1 ? "category" : "categories"}
              </span>
            </>
          )}
        </div>
      </footer>

      <DeleteChangelogDialog
        isPending={deleteMutation.isPending}
        onConfirm={handleDelete}
        onOpenChange={setShowDeleteDialog}
        open={showDeleteDialog}
      />
    </div>
  );
}
