import { redirect } from "next/navigation";
import { auth } from "~/auth/server";
import { OnboardingWizard } from "./_components/onboarding/onboarding-wizard";

export default async function HomePage() {
  const headers = await import("next/headers").then((mod) => mod.headers());

  const session = await auth.api.getSession({ headers });

  // Middleware handles unauthenticated users - this page only runs for authenticated users
  if (!session?.user) {
    return null; // Should never reach here if middleware is configured correctly
  }

  // Check if user has organizations using Better Auth API
  const userOrgs = await auth.api.listOrganizations({ headers });

  // Has organizations - Redirect to first org
  if (userOrgs && userOrgs.length > 0) {
    const firstOrg = userOrgs[0];
    if (firstOrg?.slug) {
      redirect(`/${firstOrg.slug}/feedback`);
    }
  }

  // Authenticated but no orgs - Show wizard
  return <OnboardingWizard />;
}
