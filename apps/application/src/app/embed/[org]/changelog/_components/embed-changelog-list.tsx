"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@userbubble/ui/badge";
import { Button } from "@userbubble/ui/button";
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

  const {
    data: entries,
    isLoading,
    isError,
    refetch,
  } = useQuery(
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
      <div className="space-y-6 p-5">
        {[1, 2, 3].map((i) => (
          <div className="flex gap-3" key={i}>
            <div className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              <div className="h-16 animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-5 text-center">
        <p className="mb-3 text-muted-foreground text-sm">
          We couldn't load releases.
        </p>
        <Button onClick={() => refetch()} variant="outline">
          Try again
        </Button>
      </div>
    );
  }
  if (!entries || entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground text-sm">No updates yet</p>
        <p className="mt-1 text-muted-foreground text-xs">
          Check back later for product updates
        </p>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div>
        <div className="space-y-2">
          {entries.map((entry) => {
            const date = entry.publishedAt ?? entry.createdAt;
            const description = stripHtml(entry.description);

            return (
              <button
                className="squircle relative flex w-full gap-3 rounded-2xl bg-muted/60 p-4 text-left outline-none transition-colors hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring"
                key={entry.id}
                onClick={() => setSelectedEntryId(entry.id)}
                type="button"
              >
                {/* Content */}
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex items-center gap-2">
                    <time
                      className="text-[11px] text-muted-foreground"
                      dateTime={date.toISOString()}
                    >
                      {new Date(date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                    {entry.version && (
                      <span className="font-mono text-[11px] text-muted-foreground">
                        v{entry.version}
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    {entry.coverImageUrl && (
                      <div className="squircle relative mb-3 aspect-[2.5/1] overflow-hidden rounded-xl">
                        <Image
                          alt={entry.title}
                          className="object-cover"
                          fill
                          sizes="350px"
                          src={entry.coverImageUrl}
                        />
                      </div>
                    )}
                    <h3 className="font-medium text-base leading-snug">
                      {entry.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-muted-foreground text-xs leading-relaxed">
                      {description}
                    </p>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(entry.tags as string[]).slice(0, 3).map((tag) => (
                          <Badge
                            className="text-[9px]"
                            key={tag}
                            variant="secondary"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
