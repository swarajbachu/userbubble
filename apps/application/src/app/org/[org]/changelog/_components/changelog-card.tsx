"use client";

import {
  Delete02Icon,
  PencilEdit01Icon,
  Rocket01Icon,
} from "@hugeicons-pro/core-bulk-rounded";
import type {
  getChangelogEntries,
  getLinkedFeedback,
} from "@userbubble/db/queries";
import { Button } from "@userbubble/ui/button";
import { Icon } from "@userbubble/ui/icon";
import Link from "next/link";
import { useState } from "react";
import { ChangelogDisplay } from "./changelog-display";
import { DeleteChangelogDialog } from "./delete-changelog-dialog";
import { useChangelogMutations } from "./use-changelog-mutations";

type ChangelogEntry = Awaited<
  ReturnType<typeof getChangelogEntries>
>[number] & {
  linkedFeedback: Awaited<ReturnType<typeof getLinkedFeedback>>;
};

type ChangelogCardProps = {
  entry: ChangelogEntry;
  isAdmin: boolean;
  org: string;
  organizationId: string;
};

export function ChangelogCard({
  entry,
  isAdmin,
  org,
  organizationId,
}: ChangelogCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { publishMutation, deleteMutation, isPending } = useChangelogMutations({
    organizationId,
    orgSlug: org,
    onSuccess: () => {
      // Don't redirect, just invalidate (handled by hook)
    },
  });

  const handlePublish = () => {
    publishMutation.mutate({ id: entry.id });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: entry.id });
  };

  return (
    <>
      <ChangelogDisplay
        actions={
          isAdmin && (
            <div className="flex shrink-0 items-center gap-2">
              {!entry.isPublished && (
                <Button
                  disabled={isPending}
                  onClick={handlePublish}
                  size="sm"
                  variant="default"
                >
                  <Icon icon={Rocket01Icon} size={16} />
                  Publish
                </Button>
              )}
              <Button
                render={
                  <Link href={`/org/${org}/changelog/${entry.id}/edit`} />
                }
                size="sm"
                variant="ghost"
              >
                <Icon icon={PencilEdit01Icon} size={16} />
              </Button>
              <Button
                disabled={isPending}
                onClick={() => setShowDeleteDialog(true)}
                size="sm"
                variant="ghost"
              >
                <Icon icon={Delete02Icon} size={16} />
              </Button>
            </div>
          )
        }
        author={entry.author}
        coverImageUrl={entry.coverImageUrl}
        date={entry.publishedAt ?? entry.createdAt}
        description={entry.description}
        linkedFeedback={entry.linkedFeedback}
        org={org}
        status={entry.isPublished ? "published" : "draft"}
        tags={entry.tags as string[]}
        title={entry.title}
        version={entry.version}
      />

      <DeleteChangelogDialog
        isPending={isPending}
        onConfirm={handleDelete}
        onOpenChange={setShowDeleteDialog}
        open={showDeleteDialog}
      />
    </>
  );
}
