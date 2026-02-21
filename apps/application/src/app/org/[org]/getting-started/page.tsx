import type { OnboardingState } from "@userbubble/db/schema";
import { getOrganization } from "~/lib/get-organization";
import { GettingStartedChecklist } from "./_components/getting-started-checklist";

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
    <div className="mx-auto w-full max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="font-bold text-3xl">Getting Started</h1>
        <p className="mt-1 text-muted-foreground">
          Complete these steps to get the most out of your feedback board
        </p>
      </div>

      <GettingStartedChecklist
        onboarding={onboarding}
        orgId={organization.id}
        orgSlug={org}
      />
    </div>
  );
}
