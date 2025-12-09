import { organizationQueries } from "@critichut/db/queries";
import { parseOrganizationSettings } from "@critichut/db/schema";
import { Button } from "@critichut/ui/button";
import { Icon } from "@critichut/ui/icon";
import { Add01Icon } from "@hugeicons-pro/core-duotone-rounded";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExternalFeedbackBoard } from "./_components/external-feedback-board";

type ExternalFeedbackPageProps = {
  params: Promise<{ org: string }>;
  searchParams: Promise<{ status?: string; sort?: string }>;
};

export default async function ExternalFeedbackPage({
  params,
}: ExternalFeedbackPageProps) {
  const { org } = await params;
  const organization = await organizationQueries.findBySlug(org);

  if (!organization) {
    notFound();
  }

  const settings = parseOrganizationSettings(organization.metadata);

  // For now, always show the button - the board component will handle permissions
  const showCreateButton = true;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Feedback</h1>
          <p className="mt-2 text-muted-foreground">
            Share your ideas and vote on what matters most
          </p>
        </div>
        {showCreateButton && (
          <Button>
            <Icon icon={Add01Icon} size={18} />
            Submit Feedback
          </Button>
        )}
      </div>

      <Suspense fallback={<FeedbackSkeleton />}>
        <ExternalFeedbackBoard
          organizationId={organization.id}
          settings={settings}
        />
      </Suspense>
    </div>
  );
}

function FeedbackSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div className="h-24 animate-pulse rounded-lg bg-muted" key={i} />
      ))}
    </div>
  );
}
