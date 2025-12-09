import { Suspense } from "react";
import { RoadmapBoard } from "~/components/roadmap/roadmap-board";
import { getOrganization } from "~/lib/get-organization";

type ExternalRoadmapPageProps = {
  params: Promise<{ org: string }>;
};

export default async function ExternalRoadmapPage({
  params,
}: ExternalRoadmapPageProps) {
  const { org } = await params;

  // Use cached helper - returns cached result from layout
  const organization = await getOrganization(org);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="font-bold text-2xl">Roadmap</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          See what we're working on and what's coming next
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-8 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div className="space-y-4" key={i}>
                <div className="h-20 animate-pulse rounded-lg bg-muted" />
                <div className="h-64 animate-pulse rounded-xl bg-muted" />
              </div>
            ))}
          </div>
        }
      >
        <RoadmapBoard
          isExternal={true}
          org={org}
          organizationId={organization.id}
        />
      </Suspense>
    </div>
  );
}
