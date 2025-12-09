import { organizationQueries } from "@critichut/db/queries";
import { notFound } from "next/navigation";

type ExternalRoadmapPageProps = {
  params: Promise<{ org: string }>;
};

export default async function ExternalRoadmapPage({
  params,
}: ExternalRoadmapPageProps) {
  const { org } = await params;
  const organization = await organizationQueries.findBySlug(org);

  if (!organization) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-bold text-3xl">Roadmap</h1>
        <p className="mt-2 text-muted-foreground">
          See what we're planning and working on
        </p>
      </div>

      <div className="rounded-lg border bg-muted/30 py-12 text-center">
        <p className="text-muted-foreground">
          Roadmap view coming soon! This will show planned, in-progress, and
          completed features.
        </p>
      </div>
    </div>
  );
}
