"use client";

import type { FeedbackCategory } from "@critichut/db/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@critichut/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import { categoryLabels } from "../../config";

type CategoryEditorProps = {
  postId: string;
  currentCategory: FeedbackCategory;
};

export function CategoryEditor({
  postId,
  currentCategory,
}: CategoryEditorProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateCategory = useMutation(
    trpc.feedback.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.feedback.getById.queryKey({ id: postId }),
        });
        toast.success("Category updated");
      },
      onError: () => {
        toast.error("Failed to update category");
      },
    })
  );

  return (
    <Select
      disabled={updateCategory.isPending}
      onValueChange={(value) =>
        updateCategory.mutate({
          id: postId,
          category: value as FeedbackCategory,
        })
      }
      value={currentCategory}
    >
      <SelectTrigger className="w-auto gap-2 border-none bg-secondary/50">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(categoryLabels).map(([category, label]) => (
          <SelectItem key={category} value={category}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
