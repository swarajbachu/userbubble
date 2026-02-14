import { Suspense } from "react";
import { getPublicOrganization } from "~/lib/get-organization";
import { EmbedChangelogList } from "./_components/embed-changelog-list";

type EmbedChangelogPageProps = {
  params: Promise<{ org: string }>;
};

export default async function EmbedChangelogPage({
  params,
}: EmbedChangelogPageProps) {
  const { org } = await params;
  const organization = await getPublicOrganization(org);

  return (
    <Suspense
      fallback={
        <div className="space-y-3 p-4">
          {[1, 2, 3].map((i) => (
            <div className="h-24 animate-pulse rounded-lg bg-muted" key={i} />
          ))}
        </div>
      }
    >
      <EmbedChangelogList organizationId={organization.id} />
    </Suspense>
  );
}
