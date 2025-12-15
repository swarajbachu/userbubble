"use client";

import type {
  getChangelogEntries,
  getLinkedFeedback,
} from "@critichut/db/queries";
import { Badge } from "@critichut/ui/badge";
import { Button } from "@critichut/ui/button";
import {
  DoubleCard,
  DoubleCardHeader,
  DoubleCardInner,
} from "@critichut/ui/double-card";
import { Icon } from "@critichut/ui/icon";
import {
  Delete02Icon,
  PencilEdit01Icon,
  Rocket01Icon,
} from "@hugeicons-pro/core-bulk-rounded";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { tagConfig } from "~/components/changelog/config";
import { DeleteChangelogDialog } from "./delete-changelog-dialog";
import { LinkedFeedbackList } from "./linked-feedback-list";
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
  const publishDate = entry.publishedAt ?? entry.createdAt;

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
      <DoubleCard>
        <DoubleCardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              {/* Title and version */}
              <div className="flex items-center gap-2">
                {entry.version && (
                  <Badge className="shrink-0" variant="secondary">
                    v{entry.version}
                  </Badge>
                )}
                <h3 className="truncate font-semibold text-lg">
                  {entry.title}
                </h3>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                <time dateTime={publishDate.toISOString()}>
                  {new Date(publishDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
                {entry.author && (
                  <>
                    <span>•</span>
                    <span>by {entry.author.name}</span>
                  </>
                )}
                {!entry.isPublished && (
                  <>
                    <span>•</span>
                    <Badge variant="outline">Draft</Badge>
                  </>
                )}
              </div>
            </div>

            {/* Admin actions */}
            {isAdmin && (
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
            )}
          </div>
        </DoubleCardHeader>

        <DoubleCardInner className="space-y-2 p-2">
          {/* Cover image */}
          {entry.coverImageUrl && (
            <div className="overflow-hidden rounded-lg">
              <Image
                alt={entry.title}
                className="h-auto w-full object-cover"
                height={0}
                sizes="100vw"
                src={entry.coverImageUrl}
                style={{ width: "100%", height: "auto" }}
                unoptimized
                width={0}
              />
            </div>
          )}

          {/* Description - renders rich text HTML from Tiptap editor */}
          <div
            className="tiptap-content"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Tiptap editor sanitizes content
            dangerouslySetInnerHTML={{ __html: entry.description }}
          />

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag) => {
                const config = tagConfig[tag as keyof typeof tagConfig];
                if (!config) {
                  return null;
                }

                return (
                  <Badge className={config.bg} key={tag} variant="secondary">
                    <Icon
                      className={config.color}
                      icon={config.icon}
                      size={12}
                    />
                    <span className={config.color}>{config.label}</span>
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Linked feedback */}
          {entry.linkedFeedback && entry.linkedFeedback.length > 0 && (
            <LinkedFeedbackList feedback={entry.linkedFeedback} org={org} />
          )}
        </DoubleCardInner>
      </DoubleCard>

      <DeleteChangelogDialog
        isPending={isPending}
        onConfirm={handleDelete}
        onOpenChange={setShowDeleteDialog}
        open={showDeleteDialog}
      />
    </>
  );
}
