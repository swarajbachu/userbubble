import { parseOrganizationSettings } from "@critichut/db/schema";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons-pro/core-duotone-rounded";
import { Suspense } from "react";
import { FeedbackBoard } from "~/components/feedback/feedback-board";
import { getOrganization } from "~/lib/get-organization";
import { FeedbackFilters } from "./_components/feedback-filters";
import { FeedbackSidebar } from "./_components/feedback-sidebar";

type ExternalFeedbackPageProps = {
  params: Promise<{ org: string }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function ExternalFeedbackPage({
  params,
  searchParams,
}: ExternalFeedbackPageProps) {
  const { org } = await params;
  const { status } = await searchParams;

  // Use cached helper - returns cached result from layout
  const organization = await getOrganization(org);

  // Parse organization settings for anonymous submission settings
  const settings = parseOrganizationSettings(organization.metadata);

  const getBoardTitle = (s?: string) => {
    switch (s) {
      case "feature_request":
        return "Features";
      case "bug":
        return "Bugs";
      default:
        return "All Feedback";
    }
  };

  const getBoardColor = (s?: string) => {
    switch (s) {
      case "feature_request":
        return "bg-green-500";
      case "bug":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const title = getBoardTitle(status);
  const color = getBoardColor(status);

  return (
    <div className="flex flex-col gap-8 md:flex-row">
      <aside className="w-full shrink-0 md:w-72">
        <FeedbackSidebar
          allowAnonymous={settings.publicAccess.allowAnonymousSubmissions}
          org={org}
          organizationId={organization.id}
        />
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${color}`} />
            <h1 className="flex items-center gap-2 font-bold text-2xl">
              {title}
              <HugeiconsIcon
                className="text-muted-foreground"
                icon={ArrowDown01Icon}
                size={20}
              />
            </h1>
          </div>
          <FeedbackFilters />
        </div>

        <Suspense
          fallback={
            <div className="space-y-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  className="h-12 animate-pulse rounded-lg bg-muted"
                  key={i}
                />
              ))}
            </div>
          }
        >
          <FeedbackBoard org={org} organizationId={organization.id} />
        </Suspense>
      </div>
    </div>
  );
}
