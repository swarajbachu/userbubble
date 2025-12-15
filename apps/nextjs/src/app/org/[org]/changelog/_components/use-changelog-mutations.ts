"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@userbubble/ui/toast";
import { useRouter } from "next/navigation";
import { useTRPC } from "~/trpc/react";

type UseChangelogMutationsProps = {
  organizationId: string;
  orgSlug: string;
  onSuccess?: () => void;
};

export function useChangelogMutations({
  organizationId,
  orgSlug,
  onSuccess,
}: UseChangelogMutationsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const invalidateChangelog = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.changelog.getAll.queryKey({ organizationId }),
    });

  const handleSuccess = async (message: string) => {
    await invalidateChangelog();
    toast.success(message);
    if (onSuccess) {
      onSuccess();
    } else {
      router.push(`/org/${orgSlug}/changelog`);
    }
  };

  const createMutation = useMutation(
    trpc.changelog.create.mutationOptions({
      onSuccess: () => handleSuccess("Changelog entry created!"),
      onError: () => {
        toast.error("Failed to create changelog entry");
      },
    })
  );

  const updateMutation = useMutation(
    trpc.changelog.update.mutationOptions({
      onSuccess: () => handleSuccess("Changelog entry updated!"),
      onError: () => {
        toast.error("Failed to update changelog entry");
      },
    })
  );

  const publishMutation = useMutation(
    trpc.changelog.publish.mutationOptions({
      onSuccess: () => handleSuccess("Changelog entry published!"),
      onError: () => {
        toast.error("Failed to publish changelog entry");
      },
    })
  );

  const deleteMutation = useMutation(
    trpc.changelog.delete.mutationOptions({
      onSuccess: () => handleSuccess("Changelog entry deleted"),
      onError: () => {
        toast.error("Failed to delete changelog entry");
      },
    })
  );

  return {
    createMutation,
    updateMutation,
    publishMutation,
    deleteMutation,
    isPending:
      createMutation.isPending ||
      updateMutation.isPending ||
      publishMutation.isPending ||
      deleteMutation.isPending,
  };
}
