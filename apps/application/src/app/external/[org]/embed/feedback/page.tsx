import { Suspense } from "react";
import { getPublicOrganization } from "~/lib/get-organization";
import { EmbedFeedbackList } from "./_components/embed-feedback-list";

type EmbedFeedbackPageProps = {
  params: Promise<{ org: string }>;
};

export default async function EmbedFeedbackPage({
  params,
}: EmbedFeedbackPageProps) {
  const { org } = await params;
  const organization = await getPublicOrganization(org);

  return (
    <Suspense
      fallback={
        <div className="space-y-2 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div className="h-14 animate-pulse rounded-lg bg-muted" key={i} />
          ))}
        </div>
      }
    >
      <EmbedFeedbackList organizationId={organization.id} />
    </Suspense>
  );
}
