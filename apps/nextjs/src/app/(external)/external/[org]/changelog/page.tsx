import { organizationQueries } from "@critichut/db/queries";
import { notFound } from "next/navigation";

type ExternalChangelogPageProps = {
  params: Promise<{ org: string }>;
};

export default async function ExternalChangelogPage({
  params,
}: ExternalChangelogPageProps) {
  const { org } = await params;
  const organization = await organizationQueries.findBySlug(org);

  if (!organization) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-bold text-3xl">Changelog</h1>
        <p className="mt-2 text-muted-foreground">
          Stay up to date with new features and improvements
        </p>
      </div>

      <div className="rounded-lg border bg-muted/30 py-12 text-center">
        <p className="text-muted-foreground">
          Changelog entries coming soon! This will show all product updates and
          releases.
        </p>
      </div>
    </div>
  );
}
