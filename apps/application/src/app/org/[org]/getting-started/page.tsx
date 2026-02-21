import type { OnboardingState } from "@userbubble/db/schema";
import { getOrgContextWithMetadata } from "~/lib/get-org-context";
import { GettingStartedView } from "./_components/getting-started-view";

type GettingStartedPageProps = {
  params: Promise<{ org: string }>;
};

export default async function GettingStartedPage({
  params,
}: GettingStartedPageProps) {
  const { org } = await params;
  const { organization } = await getOrgContextWithMetadata(org);

  const onboarding = (organization.onboarding ??
    null) as OnboardingState | null;

  return (
    <GettingStartedView
      onboarding={onboarding}
      organization={organization}
      orgSlug={org}
    />
  );
}
