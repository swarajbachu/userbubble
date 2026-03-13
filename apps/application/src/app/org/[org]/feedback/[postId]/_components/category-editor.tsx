"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FeedbackCategory } from "@userbubble/db/schema";
import { cn } from "@userbubble/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@userbubble/ui/select";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { categories, getCategory } from "~/components/feedback/config";
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

  const current = getCategory(currentCategory);

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
      <SelectTrigger
        className={cn(
          "h-7 w-auto gap-1.5 border-none px-2.5 font-medium text-xs shadow-none",
          current?.color.replace("text-", "bg-").replace("-500", "-500/15"),
          current?.color
        )}
      >
        <SelectValue>
          {current && (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  current.color.replace("text-", "bg-")
                )}
              />
              <span>{current.label}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {categories.map((c) => (
          <SelectItem key={c.value} value={c.value}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  c.color.replace("text-", "bg-")
                )}
              />
              <span>{c.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
