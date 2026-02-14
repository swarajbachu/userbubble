"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@userbubble/ui/badge";
import Image from "next/image";
import { EmbedHeader } from "~/app/external/_components/embed-header";
import { useTRPC } from "~/trpc/react";

type EmbedChangelogDetailProps = {
  entryId: string;
  onBack: () => void;
};

export function EmbedChangelogDetail({
  entryId,
  onBack,
}: EmbedChangelogDetailProps) {
  const trpc = useTRPC();

  const { data: entry, isLoading } = useQuery(
    trpc.changelog.getById.queryOptions({ id: entryId })
  );

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <EmbedHeader onBack={onBack} title="Loading..." />
        <div className="space-y-3 p-4">
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
          <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex flex-col">
        <EmbedHeader onBack={onBack} title="Not found" />
        <div className="p-4 text-center text-muted-foreground text-sm">
          Entry not found
        </div>
      </div>
    );
  }

  const date = entry.publishedAt ?? entry.createdAt;

  return (
    <div className="flex flex-col">
      <EmbedHeader onBack={onBack} title={entry.title} />

      <div className="overflow-y-auto p-4">
        {entry.coverImageUrl && (
          <div className="relative mb-4 aspect-video overflow-hidden rounded-lg">
            <Image
              alt={entry.title}
              className="object-cover"
              fill
              sizes="400px"
              src={entry.coverImageUrl}
            />
          </div>
        )}

        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <time dateTime={date.toISOString()}>
            {new Date(date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
          {entry.version && (
            <>
              <span>&middot;</span>
              <span className="font-mono">v{entry.version}</span>
            </>
          )}
        </div>

        <h2 className="mt-2 font-semibold text-base">{entry.title}</h2>

        {entry.tags && entry.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {(entry.tags as string[]).map((tag) => (
              <Badge className="text-[10px]" key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div
          className="prose prose-sm prose-zinc dark:prose-invert mt-4 max-w-none"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Changelog descriptions are admin-authored HTML content
          dangerouslySetInnerHTML={{ __html: entry.description }}
        />
      </div>
    </div>
  );
}
