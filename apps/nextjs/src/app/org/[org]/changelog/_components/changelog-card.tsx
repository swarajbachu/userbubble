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
import { toast } from "@critichut/ui/toast";
import {
  Delete02Icon,
  PencilEdit01Icon,
  Rocket01Icon,
} from "@hugeicons-pro/core-bulk-rounded";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { tagConfig } from "~/components/changelog/config";
import { useTRPC } from "~/trpc/react";
import { LinkedFeedbackList } from "./linked-feedback-list";

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
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const publishDate = entry.publishedAt ?? entry.createdAt;

  const publishMutation = useMutation(
    trpc.changelog.publish.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.changelog.getAll.queryKey({ organizationId }),
        });
        toast.success("Entry published!");
      },
      onError: () => {
        toast.error("Failed to publish entry");
      },
    })
  );

  const deleteMutation = useMutation(
    trpc.changelog.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.changelog.getAll.queryKey({ organizationId }),
        });
        toast.success("Entry deleted");
      },
      onError: () => {
        toast.error("Failed to delete entry");
      },
    })
  );

  const handlePublish = () => {
    publishMutation.mutate({ id: entry.id });
  };

  const handleDelete = () => {
    // TODO: Replace with custom confirmation dialog
    deleteMutation.mutate({ id: entry.id });
  };

  return (
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
              <h3 className="truncate font-semibold text-lg">{entry.title}</h3>
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
                  disabled={publishMutation.isPending}
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
                disabled={deleteMutation.isPending}
                onClick={handleDelete}
                size="sm"
                variant="ghost"
              >
                <Icon icon={Delete02Icon} size={16} />
              </Button>
            </div>
          )}
        </div>
      </DoubleCardHeader>

      <DoubleCardInner className="space-y-4">
        {/* Cover image */}
        {entry.coverImageUrl && (
          <div className="overflow-hidden rounded-lg">
            <img
              alt={entry.title}
              className="h-auto w-full object-cover"
              src={entry.coverImageUrl}
            />
          </div>
        )}

        {/* Description */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
            {entry.description}
          </p>
        </div>

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {entry.tags.map((tag) => {
              const config = tagConfig[tag as keyof typeof tagConfig];
              if (!config) return null;

              return (
                <Badge className={config.bg} key={tag} variant="secondary">
                  <Icon className={config.color} icon={config.icon} size={12} />
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
  );
}
