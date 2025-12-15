"use client";

import type { getChangelogEntry } from "@critichut/db/queries";
import { useForm } from "@tanstack/react-form";

type ChangelogEntry = Awaited<ReturnType<typeof getChangelogEntry>>;

export type ChangelogFormValues = {
  title: string;
  description: string;
  version: string;
  coverImageUrl: string;
  tags: string[];
  feedbackPostIds: string[];
};

type UseChangelogFormProps = {
  entry?: ChangelogEntry;
  onSubmit: (values: ChangelogFormValues) => Promise<void>;
};

export function useChangelogForm({ entry, onSubmit }: UseChangelogFormProps) {
  return useForm({
    defaultValues: {
      title: entry?.title ?? "",
      description: entry?.description ?? "",
      version: entry?.version ?? "",
      coverImageUrl: entry?.coverImageUrl ?? "",
      tags: (entry?.tags as string[]) ?? [],
      feedbackPostIds:
        entry?.linkedFeedback?.map((f) => f.id) ?? ([] as string[]),
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });
}
