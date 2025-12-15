import { Suspense } from "react";
import { getOrganization } from "~/lib/get-organization";
import { ChangelogBoard } from "./_components/changelog-board";
import { ChangelogSkeleton } from "./_components/changelog-skeleton";

type ChangelogPageProps = {
  params: Promise<{ org: string }>;
};

export default async function ChangelogPage({ params }: ChangelogPageProps) {
  const { org } = await params;

  // Use cached helper - returns cached result from layout
  const organization = await getOrganization(org);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 py-6">
        <h1 className="font-bold text-2xl">Changelog</h1>
        <p className="text-muted-foreground text-sm">
          Product updates and release notes
        </p>
      </div>

      <Suspense fallback={<ChangelogSkeleton />}>
        <ChangelogBoard org={org} organizationId={organization.id} />
      </Suspense>
    </div>
  );
}
