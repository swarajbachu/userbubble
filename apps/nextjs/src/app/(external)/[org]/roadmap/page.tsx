import { getOrganization } from "~/lib/get-organization";

type ExternalRoadmapPageProps = {
  params: Promise<{ org: string }>;
};

export default async function ExternalRoadmapPage({
  params,
}: ExternalRoadmapPageProps) {
  const { org } = await params;

  // Use cached helper - returns cached result from layout
  await getOrganization(org);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="font-bold text-2xl">Roadmap</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          See what we're working on and what's coming next
        </p>
      </div>

      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">Roadmap view coming soon...</p>
      </div>
    </div>
  );
}
