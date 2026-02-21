import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, getSession } from "~/auth/server";
import { OnboardingWizard } from "../_components/onboarding/onboarding-wizard";

export default async function HomePage() {
  const session = await getSession();

  // Middleware handles unauthenticated users - this page only runs for authenticated users
  if (!session?.user) {
    return null; // Should never reach here if middleware is configured correctly
  }

  console.log(session.user);

  // Check if user has organizations using Better Auth API
  const userOrgs = await auth.api.listOrganizations({
    headers: await headers(),
  });

  // Has organizations - Redirect to first org
  if (userOrgs && userOrgs.length > 0) {
    const firstOrg = userOrgs[0];
    if (firstOrg?.slug) {
      redirect(`/org/${firstOrg.slug}/feedback`);
    }
  }

  // Authenticated but no orgs - Show wizard
  return <OnboardingWizard />;
}
