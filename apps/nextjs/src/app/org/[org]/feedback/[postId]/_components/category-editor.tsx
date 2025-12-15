"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FeedbackCategory } from "@userbubble/db/schema";
import { Icon } from "@userbubble/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@userbubble/ui/select";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { categoryConfig, categoryLabels } from "~/components/feedback/config";
import { useTRPC } from "~/trpc/react";

type CategoryEditorProps = {
  postId: string;
  currentCategory: FeedbackCategory;
};

export function CategoryEditor({
  postId,
  currentCategory,
}: CategoryEditorProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const updateCategory = useMutation(
    trpc.feedback.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.feedback.getById.queryKey({ id: postId }),
        });
        toast.success("Category updated");
        router.refresh();
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
      <SelectTrigger className="w-54">
        <SelectValue>
          <div className="flex items-center gap-2">
            <Icon icon={categoryConfig[currentCategory].icon} size={16} />
            <span className="capitalize">
              {currentCategory.replace("_", " ")}
            </span>
          </div>
        </SelectValue>
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
