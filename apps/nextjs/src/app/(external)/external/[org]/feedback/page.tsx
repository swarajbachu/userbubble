import { parseOrganizationSettings } from "@critichut/db/schema";
import { Suspense } from "react";
import { FeedbackBoard } from "~/components/feedback/feedback-board";
import { getOrganization } from "~/lib/get-organization";
import { CreateFeedbackButton } from "./_components/create-feedback-button";

type ExternalFeedbackPageProps = {
  params: Promise<{ org: string }>;
};

export default async function ExternalFeedbackPage({
  params,
}: ExternalFeedbackPageProps) {
  const { org } = await params;

  // Use cached helper - returns cached result from layout
  const organization = await getOrganization(org);

  // Parse organization settings for anonymous submission settings
  const settings = parseOrganizationSettings(organization.metadata);

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl">Feedback</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Share your ideas and vote on features you'd like to see
          </p>
        </div>
        <CreateFeedbackButton
          allowAnonymous={settings.publicAccess.allowAnonymousSubmissions}
          organizationId={organization.id}
        />
      </div>

      <Suspense
        fallback={
          <div className="space-y-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div className="h-12 animate-pulse rounded-lg bg-muted" key={i} />
            ))}
          </div>
        }
      >
        <FeedbackBoard org={org} organizationId={organization.id} />
      </Suspense>
    </div>
  );
}
