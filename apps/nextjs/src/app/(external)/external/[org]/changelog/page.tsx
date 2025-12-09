import { getOrganization } from "~/lib/get-organization";

type ExternalChangelogPageProps = {
  params: Promise<{ org: string }>;
};

export default async function ExternalChangelogPage({
  params,
}: ExternalChangelogPageProps) {
  const { org } = await params;

  // Use cached helper - returns cached result from layout
  await getOrganization(org);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="font-bold text-2xl">Changelog</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Stay updated with our latest releases and improvements
        </p>
      </div>

      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">Changelog coming soon...</p>
      </div>
    </div>
  );
}
