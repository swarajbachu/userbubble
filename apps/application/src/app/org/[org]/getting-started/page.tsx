import type { OnboardingState } from "@userbubble/db/schema";
import { getOrganization } from "~/lib/get-organization";
import { GettingStartedView } from "./_components/getting-started-view";

type GettingStartedPageProps = {
  params: Promise<{ org: string }>;
};

export default async function GettingStartedPage({
  params,
}: GettingStartedPageProps) {
  const { org } = await params;
  const organization = await getOrganization(org);

  const onboarding = (organization.onboarding ??
    null) as OnboardingState | null;

  return (
    <GettingStartedView
      onboarding={onboarding}
      orgId={organization.id}
      orgName={organization.name}
      orgSlug={org}
    />
  );
}
