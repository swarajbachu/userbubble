"use client";

import type { getChangelogEntry } from "@critichut/db/queries";
import { useForm } from "@tanstack/react-form";

type ChangelogEntry = Awaited<ReturnType<typeof getChangelogEntry>>;

export function useChangelogForm(params: {
  mode: "create" | "edit";
  organizationId: string;
  entry?: ChangelogEntry;
  onSuccess: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createMutation: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateMutation: any;
}) {
  const {
    mode,
    organizationId,
    entry,
    onSuccess,
    createMutation,
    updateMutation,
  } = params;

  return useForm({
    defaultValues: {
      title: entry?.title || "",
      description: entry?.description || "",
      version: entry?.version || "",
      coverImageUrl: entry?.coverImageUrl || "",
      tags: (entry?.tags as string[]) || [],
      feedbackPostIds:
        entry?.linkedFeedback?.map((f) => f.id) || ([] as string[]),
    },
    onSubmit: async ({ value }) => {
      if (mode === "edit" && entry) {
        await updateMutation.mutateAsync({
          id: entry.id,
          title: value.title,
          description: value.description,
          version: value.version || undefined,
          coverImageUrl: value.coverImageUrl || undefined,
          tags: value.tags.length > 0 ? value.tags : undefined,
        });
      } else {
        await createMutation.mutateAsync({
          organizationId,
          title: value.title,
          description: value.description,
          version: value.version || undefined,
          coverImageUrl: value.coverImageUrl || undefined,
          tags: value.tags.length > 0 ? value.tags : undefined,
          feedbackPostIds:
            value.feedbackPostIds.length > 0
              ? value.feedbackPostIds
              : undefined,
          isPublished: false,
        });
      }
      onSuccess();
    },
  });
}
