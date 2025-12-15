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

function groupEntriesByMonth(entries: ChangelogEntry[]) {
  const grouped = new Map<string, ChangelogEntry[]>();

  for (const entry of entries) {
    const date = entry.publishedAt ?? entry.createdAt;
    const monthKey = new Date(date).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    if (!grouped.has(monthKey)) {
      grouped.set(monthKey, []);
    }
    grouped.get(monthKey)?.push(entry);
  }

  return Array.from(grouped.entries());
}

export function ChangelogTimeline({
  entries,
  isAdmin,
  org,
  organizationId,
}: ChangelogTimelineProps) {
  const groupedEntries = groupEntriesByMonth(entries);

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute top-0 bottom-0 left-[9px] w-0.5 bg-border" />

      {/* Timeline entries grouped by month */}
      <div className="space-y-12">
        {groupedEntries.map(([monthYear, monthEntries]) => (
          <div className="space-y-4" key={monthYear}>
            {/* Month header */}
            <div className="flex items-center gap-4">
              <div className="h-5 w-5 shrink-0 rounded-full border-4 border-background bg-primary" />
              <h2 className="font-semibold text-lg">{monthYear}</h2>
            </div>

            {/* Entries for this month */}
            <div className="ml-9 space-y-4">
              {monthEntries.map((entry) => (
                <ChangelogCard
                  entry={entry}
                  isAdmin={isAdmin}
                  key={entry.id}
                  org={org}
                  organizationId={organizationId}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
