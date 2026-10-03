import { parseOrganizationSettings } from "@userbubble/validators/organization";
import type { Metadata } from "next";
import { getSession } from "~/auth/server";
import { RoadmapBoard } from "~/components/roadmap/roadmap-board";
import { RoadmapComingSoon } from "~/components/roadmap/roadmap-coming-soon";
import { getPublicOrganization } from "~/lib/get-organization";
import { publicUrl } from "~/lib/public-content";
import { getQueryClient, HydrateClient, trpc } from "~/trpc/server";

type ExternalRoadmapPageProps = {
  params: Promise<{ org: string }>;
};

export async function generateMetadata({
  params,
}: ExternalRoadmapPageProps): Promise<Metadata> {
  const { org } = await params;
  const organization = await getPublicOrganization(org);

  const description = `Explore the ${organization.name} product roadmap. See what we're working on, what's coming next, and what's been completed.`;

  return {
    alternates: { canonical: publicUrl(org, "/roadmap") },
    title: `Roadmap - ${organization.name}`,
    description,
    openGraph: {
      title: `${organization.name} Roadmap`,
      description,
      url: publicUrl(org, "/roadmap"),
      type: "website",
      images: organization.logo ? [{ url: organization.logo }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${organization.name} Roadmap`,
      description,
      images: organization.logo ? [organization.logo] : [],
    },
  };
}

export default async function ExternalRoadmapPage({
  params,
}: ExternalRoadmapPageProps) {
  const { org } = await params;

  // Use cached helper - returns cached result from layout
  const organization = await getPublicOrganization(org);

  // Check if roadmap is enabled
  const settings = parseOrganizationSettings(organization.metadata);
  if (!settings.feedback?.enableRoadmap) {
    return <RoadmapComingSoon />;
  }
  const [session, initialPosts] = await Promise.all([
    getSession(),
    getQueryClient().fetchQuery(
      trpc.feedback.getAll.queryOptions({
        organizationId: organization.id,
        sortBy: "votes",
      })
    ),
  ]);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="font-bold text-2xl">Roadmap</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          See what we're working on and what's coming next
        </p>
      </div>

      <HydrateClient>
        <RoadmapBoard
          initialPosts={initialPosts}
          isAuthenticated={Boolean(session?.user)}
          isExternal={true}
          org={org}
          organizationId={organization.id}
        />
      </HydrateClient>
    </div>
  );
}
