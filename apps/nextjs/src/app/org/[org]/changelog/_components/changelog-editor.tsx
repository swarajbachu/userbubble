"use client";

import type { getChangelogEntry } from "@critichut/db/queries";
import { Button } from "@critichut/ui/button";
import { Icon } from "@critichut/ui/icon";
import { toast } from "@critichut/ui/toast";
import {
  ArrowLeft01Icon,
  Delete02Icon,
  Rocket01Icon,
} from "@hugeicons-pro/core-bulk-rounded";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTRPC } from "~/trpc/react";
import { ChangelogEditorForm } from "./changelog-editor-form";
import { ChangelogEditorPreview } from "./changelog-editor-preview";
import { useChangelogForm } from "./use-changelog-form";

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
  const queryClient = useQueryClient();

  const createMutation = useMutation(
    trpc.changelog.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.changelog.getAll.queryKey({ organizationId }),
        });
        toast.success("Changelog entry created!");
        router.push(`/org/${org}/changelog`);
      },
      onError: () => {
        toast.error("Failed to create changelog entry");
      },
    })
  );

  const updateMutation = useMutation(
    trpc.changelog.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.changelog.getAll.queryKey({ organizationId }),
        });
        toast.success("Changelog entry updated!");
        router.push(`/org/${org}/changelog`);
      },
      onError: () => {
        toast.error("Failed to update changelog entry");
      },
    })
  );

  const publishMutation = useMutation(
    trpc.changelog.publish.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.changelog.getAll.queryKey({ organizationId }),
        });
        toast.success("Changelog entry published!");
        router.push(`/org/${org}/changelog`);
      },
      onError: () => {
        toast.error("Failed to publish changelog entry");
      },
    })
  );

  const deleteMutation = useMutation(
    trpc.changelog.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.changelog.getAll.queryKey({ organizationId }),
        });
        toast.success("Changelog entry deleted");
        router.push(`/org/${org}/changelog`);
      },
      onError: () => {
        toast.error("Failed to delete changelog entry");
      },
    })
  );

  const form = useChangelogForm({
    mode,
    organizationId,
    entry,
    onSuccess: () => {
      if (mode === "edit") {
        toast.success("Changelog entry updated!");
      } else {
        toast.success("Changelog entry created!");
      }
    },
    createMutation,
    updateMutation,
  });

  const handlePublish = async () => {
    if (mode === "edit" && entry) {
      publishMutation.mutate({ id: entry.id });
    } else {
      // For create mode, submit with isPublished: true
      const values = form.state.values;
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

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    publishMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Action Bar */}
      <div className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleCancel}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Icon icon={ArrowLeft01Icon} size={16} />
              Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-semibold text-lg">
              {mode === "create"
                ? "Create Changelog Entry"
                : "Edit Changelog Entry"}
            </h1>
            {entry && !entry.isPublished && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs">
                Draft
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {mode === "edit" && entry && (
              <Button
                disabled={isPending}
                onClick={handleDelete}
                size="sm"
                variant="ghost"
              >
                <Icon icon={Delete02Icon} size={16} />
                Delete
              </Button>
            )}

            <Button
              disabled={isPending}
              onClick={() => form.handleSubmit()}
              size="sm"
              variant="outline"
            >
              {isPending && "Saving..."}
              {!isPending && mode === "edit" && "Save Changes"}
              {!isPending && mode === "create" && "Save Draft"}
            </Button>

            <Button
              disabled={isPending || entry?.isPublished}
              onClick={handlePublish}
              size="sm"
            >
              <Icon icon={Rocket01Icon} size={16} />
              {isPending ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 bg-muted/30">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-2">
          {/* Left Panel - Form */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <ChangelogEditorForm form={form} organizationId={organizationId} />
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <ChangelogEditorPreview
              coverImageUrl={form.state.values.coverImageUrl}
              description={form.state.values.description}
              tags={form.state.values.tags}
              title={form.state.values.title}
              version={form.state.values.version}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
