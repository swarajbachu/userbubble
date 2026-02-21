import { parseOrganizationSettings } from "@userbubble/db/org/organization-settings";
import { Suspense } from "react";
import { RoadmapComingSoon } from "~/components/roadmap/roadmap-coming-soon";
import { getPublicOrganization } from "~/lib/get-organization";
import { EmbedRoadmapList } from "./_components/embed-roadmap-list";

type EmbedRoadmapPageProps = {
  params: Promise<{ org: string }>;
};

export default async function EmbedRoadmapPage({
  params,
}: EmbedRoadmapPageProps) {
  const { org } = await params;
  const organization = await getPublicOrganization(org);
  const settings = parseOrganizationSettings(organization.metadata);

  if (!settings.feedback?.enableRoadmap) {
    return <RoadmapComingSoon />;
  }

  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-4">
          {[1, 2, 3].map((i) => (
            <div className="h-20 animate-pulse rounded-lg bg-muted" key={i} />
          ))}
        </div>
      }
    >
      <EmbedRoadmapList organizationId={organization.id} orgSlug={org} />
    </Suspense>
  );
}
