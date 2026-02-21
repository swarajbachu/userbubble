"use server";

import { organizationQueries } from "@userbubble/db/queries";
import {
  defaultOnboardingState,
  type OnboardingState,
} from "@userbubble/db/schema";
import { revalidatePath } from "next/cache";

export async function initializeOnboarding(orgId: string) {
  await organizationQueries.update(orgId, {
    onboarding: defaultOnboardingState,
  });
}

export async function toggleOnboardingStep(
  orgId: string,
  orgSlug: string,
  key: keyof OnboardingState,
  value: boolean
) {
  const org = await organizationQueries.findById(orgId);
  if (!org) {
    return;
  }

  const current = (org.onboarding as OnboardingState) ?? defaultOnboardingState;
  await organizationQueries.update(orgId, {
    onboarding: { ...current, [key]: value },
  });

  revalidatePath(`/org/${orgSlug}/getting-started`);
}
