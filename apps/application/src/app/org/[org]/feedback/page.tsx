import { Suspense } from "react";
import { getOrganization } from "~/lib/get-organization";
import { FeedbackBoard } from "./_components/feedback-board";

type FeedbackPageProps = {
  params: Promise<{ org: string }>;
  searchParams: Promise<{ status?: string; sort?: string }>;
};

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const { org } = await params;

  // Use cached helper - returns cached result from layout
  const organization = await getOrganization(org);

  return (
    <section className="w-full">
      <Suspense
        fallback={
          <div className="space-y-1 p-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div className="h-10 animate-pulse rounded-lg bg-muted" key={i} />
            ))}
          </div>
        }
      >
        <FeedbackBoard org={org} organizationId={organization.id} />
      </Suspense>
    </section>
  );
}
