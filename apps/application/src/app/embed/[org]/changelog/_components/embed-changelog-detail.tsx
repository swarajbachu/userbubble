"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@userbubble/ui/badge";
import Image from "next/image";
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
      <div className="space-y-3 p-5">
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-20 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="p-5 text-center text-muted-foreground text-sm">
        Entry not found
      </div>
    );
  }

  const date = entry.publishedAt ?? entry.createdAt;

  return (
    <div className="p-5">
      {/* Back link */}
      <button
        className="mb-3 flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
        onClick={onBack}
        type="button"
      >
        <svg
          fill="none"
          height="14"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="14"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back
      </button>

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
  );
}
