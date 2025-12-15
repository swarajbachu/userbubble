import type {
  getChangelogEntries,
  getLinkedFeedback,
} from "@critichut/db/queries";
import { ChangelogCard } from "./changelog-card";

type ChangelogEntry = Awaited<
  ReturnType<typeof getChangelogEntries>
>[number] & {
  linkedFeedback: Awaited<ReturnType<typeof getLinkedFeedback>>;
};

type ChangelogTimelineProps = {
  entries: ChangelogEntry[];
  isAdmin: boolean;
  org: string;
  organizationId: string;
};

export function ChangelogTimeline({
  entries,
  isAdmin,
  org,
  organizationId,
}: ChangelogTimelineProps) {
  return (
    <div className="space-y-12">
      {entries.map((entry) => {
        const date = entry.publishedAt ?? entry.createdAt;
        const formattedDate = new Date(date).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

        return (
          <div className="group relative flex gap-8" key={entry.id}>
            {/* Sticky Date Sidebar */}
            <div className="hidden shrink-0 lg:block lg:w-48">
              <div className="sticky top-24 text-right">
                <time
                  className="block font-semibold text-muted-foreground text-sm"
                  dateTime={date.toISOString()}
                >
                  {formattedDate}
                </time>
                {entry.version && (
                  <span className="mt-1 block font-mono text-muted-foreground/60 text-xs">
                    v{entry.version}
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              {/* Mobile Date Header */}
              <div className="mb-2 flex items-baseline justify-between lg:hidden">
                <time
                  className="font-medium text-muted-foreground text-sm"
                  dateTime={date.toISOString()}
                >
                  {formattedDate}
                </time>
                {entry.version && (
                  <span className="font-mono text-muted-foreground/60 text-xs">
                    v{entry.version}
                  </span>
                )}
              </div>

              <ChangelogCard
                entry={entry}
                isAdmin={isAdmin}
                org={org}
                organizationId={organizationId}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
