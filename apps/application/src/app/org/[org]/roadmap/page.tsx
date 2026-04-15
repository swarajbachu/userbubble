import { parseOrganizationSettings } from "@userbubble/db/schema";
import { Suspense } from "react";
import { getSession } from "~/auth/server";
import { RoadmapComingSoon } from "~/components/roadmap/roadmap-coming-soon";
import { getOrganization } from "~/lib/get-organization";
import { RoadmapBoard } from "./_components/roadmap-board";

type RoadmapPageProps = {
  params: Promise<{ org: string }>;
};

export default async function RoadmapPage({ params }: RoadmapPageProps) {
  const { org } = await params;

  const organization = await getOrganization(org);

  const settings = parseOrganizationSettings(organization.metadata);
  if (!settings.feedback?.enableRoadmap) {
    return <RoadmapComingSoon />;
  }

  const session = await getSession();

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="font-bold text-2xl">Roadmap</h1>
      </div>

      <Suspense
        fallback={
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div className="w-[280px] shrink-0 space-y-3" key={i}>
                <div className="h-7 w-24 animate-pulse rounded-md bg-muted" />
                <div className="space-y-2">
                  {[1, 2].map((j) => (
                    <div
                      className="h-20 animate-pulse rounded-lg bg-muted"
                      key={j}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        }
      >
        <RoadmapBoard
          isAuthenticated={!!session?.user}
          org={org}
          organizationId={organization.id}
        />
      </Suspense>
    </div>
  );
}
