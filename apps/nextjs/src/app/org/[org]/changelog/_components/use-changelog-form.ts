"use client";

import type { getChangelogEntry } from "@critichut/db/queries";
import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";

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
  onValuesChange?: (values: ChangelogFormValues) => void;
};

export function useChangelogForm({
  entry,
  onSubmit,
  onValuesChange,
}: UseChangelogFormProps) {
  const form = useForm({
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

  // Subscribe to form state changes for real-time preview
  useEffect(() => {
    if (!onValuesChange) {
      return;
    }

    const unsubscribe = form.store.subscribe(() => {
      onValuesChange(form.state.values);
    });

    return unsubscribe;
  }, [form, onValuesChange]);

  return form;
}
