"use server";
import { appRouter, createTRPCContext } from "@userbubble/api";
import type { OnboardingState } from "@userbubble/db/schema";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "~/auth/server";

async function caller() {
  return appRouter.createCaller(
    await createTRPCContext({ headers: await headers(), auth })
  );
}
export async function initializeOnboarding(orgId: string) {
  return (await caller()).organization.initializeOnboarding({
    organizationId: orgId,
  });
}
export async function toggleOnboardingStep(
  orgId: string,
  orgSlug: string,
  key: keyof OnboardingState,
  value: boolean
) {
  await (await caller()).organization.updateOnboarding({
    organizationId: orgId,
    steps: { [key]: value },
  });
  revalidatePath(`/org/${orgSlug}/getting-started`);
}
