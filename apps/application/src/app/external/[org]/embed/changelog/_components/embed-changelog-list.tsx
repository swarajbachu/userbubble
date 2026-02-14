"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@userbubble/ui/badge";
import Image from "next/image";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";
import { EmbedChangelogDetail } from "./embed-changelog-detail";

type EmbedChangelogListProps = {
  organizationId: string;
};

export function EmbedChangelogList({
  organizationId,
}: EmbedChangelogListProps) {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const trpc = useTRPC();

  const { data: entries, isLoading } = useQuery(
    trpc.changelog.getAll.queryOptions({
      organizationId,
      published: true,
    })
  );

  if (selectedEntryId) {
    return (
      <EmbedChangelogDetail
        entryId={selectedEntryId}
        onBack={() => setSelectedEntryId(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div className="h-24 animate-pulse rounded-lg bg-muted" key={i} />
        ))}
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-sm">No updates yet</p>
        <p className="mt-1 text-muted-foreground/60 text-xs">
          Check back later for product updates
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {entries.map((entry) => {
        const date = entry.publishedAt ?? entry.createdAt;
        const description = stripHtml(entry.description);

        return (
          <button
            className="flex w-full gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-secondary/30"
            key={entry.id}
            onClick={() => setSelectedEntryId(entry.id)}
            type="button"
          >
            {entry.coverImageUrl && (
              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md">
                <Image
                  alt={entry.title}
                  className="object-cover"
                  fill
                  sizes="80px"
                  src={entry.coverImageUrl}
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <time
                  className="text-[11px] text-muted-foreground"
                  dateTime={date.toISOString()}
                >
                  {new Date(date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </time>
                {entry.version && (
                  <span className="font-mono text-[11px] text-muted-foreground/60">
                    v{entry.version}
                  </span>
                )}
              </div>
              <h3 className="mt-0.5 line-clamp-1 font-medium text-sm">
                {entry.title}
              </h3>
              <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs leading-relaxed">
                {description}
              </p>
              {entry.tags && entry.tags.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {(entry.tags as string[]).slice(0, 3).map((tag) => (
                    <Badge className="text-[9px]" key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}
