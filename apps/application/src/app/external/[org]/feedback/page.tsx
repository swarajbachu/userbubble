import { parseOrganizationSettings } from "@userbubble/db/schema";
import type { Metadata } from "next";
import { Suspense } from "react";
import { FeedbackBoard } from "~/components/feedback/feedback-board";
import { getPublicOrganization } from "~/lib/get-organization";
import { CreateFeedbackButton } from "./_components/create-feedback-button";
import { FeedbackFilters } from "./_components/feedback-filters";
import { FeedbackSidebar } from "./_components/feedback-sidebar";

type ExternalFeedbackPageProps = {
  params: Promise<{ org: string }>;
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: ExternalFeedbackPageProps): Promise<Metadata> {
  const { org } = await params;
  const { category } = await searchParams;
  const organization = await getPublicOrganization(org);

  const getBoardTitle = (c?: string) => {
    switch (c) {
      case "feature_request":
        return "Feature Requests";
      case "bug":
        return "Bug Reports";
      default:
        return "Feedback";
    }
  };

  const title = getBoardTitle(category);
  const description = category
    ? `Browse and vote on ${title.toLowerCase()} for ${organization.name}. Share your ideas and help shape our product.`
    : `Share feedback, request features, and report bugs for ${organization.name}. Help us build a better product together.`;

  return {
    title: `${title} - ${organization.name}`,
    description,
    openGraph: {
      title: `${organization.name} ${title}`,
      description,
      url: "/feedback",
      type: "website",
      images: organization.logo ? [{ url: organization.logo }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${organization.name} ${title}`,
      description,
      images: organization.logo ? [organization.logo] : [],
    },
  };
}

export default async function ExternalFeedbackPage({
  params,
  searchParams,
}: ExternalFeedbackPageProps) {
  const { org } = await params;
  const { category } = await searchParams;

  // Use cached helper - returns cached result from layout
  const organization = await getPublicOrganization(org);

  // Parse organization settings for anonymous submission settings
  const settings = parseOrganizationSettings(organization.metadata);

  const getBoardTitle = (c?: string) => {
    switch (c) {
      case "feature_request":
        return "Features";
      case "bug":
        return "Bugs";
      default:
        return "All Feedback";
    }
  };

  const getBoardColor = (c?: string) => {
    switch (c) {
      case "feature_request":
        return "bg-green-500";
      case "bug":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const title = getBoardTitle(category);
  const color = getBoardColor(category);

  return (
    <div className="flex flex-col gap-5 md:flex-row md:gap-8">
      <aside className="hidden w-full shrink-0 md:block md:w-72">
        <FeedbackSidebar
          allowAnonymous={settings.publicAccess.allowAnonymousSubmissions}
          org={org}
          organizationId={organization.id}
        />
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-4 flex items-start justify-between gap-3 md:mb-6 md:items-center">
          <div className="flex items-center gap-3">
            <div className={`hidden h-3 w-3 rounded-full md:block ${color}`} />
            <div className="hidden md:block">
              <h1 className="font-bold text-2xl">{title}</h1>
            </div>
            <div className="md:hidden">
              <FeedbackSidebar
                allowAnonymous={settings.publicAccess.allowAnonymousSubmissions}
                mode="selector"
                org={org}
                organizationId={organization.id}
              />
            </div>
          </div>
          <FeedbackFilters organizationId={organization.id} />
        </div>

        <div className="mb-4 md:hidden">
          <CreateFeedbackButton
            allowAnonymous={settings.publicAccess.allowAnonymousSubmissions}
            className="w-full justify-between px-5 text-left text-sm"
            organizationId={organization.id}
          >
            Give Feedback
          </CreateFeedbackButton>
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
          <FeedbackBoard
            className="p-0 md:p-2"
            isExternal={true}
            org={org}
            organizationId={organization.id}
          />
        </Suspense>
      </div>
    </div>
  );
}
