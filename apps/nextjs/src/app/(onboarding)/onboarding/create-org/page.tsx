import { organizationQueries } from "@critichut/db/queries";
import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";
import { CreateOrgForm } from "../_components/create-org-form";

export default async function CreateOrgPage() {
  // Require authentication
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/onboarding/create-org");
  }

  // Check if user already has organizations
  // If they do, redirect to first org's dashboard
  const userOrgs = await organizationQueries.listUserOrganizations(
    session.user.id
  );

  if (userOrgs.length > 0) {
    const firstOrg = userOrgs[0];
    if (firstOrg) {
      redirect(`/${firstOrg.organization.slug}/feedback`);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-bold text-3xl">Create Your Organization</h1>
        <p className="text-muted-foreground">
          Organizations help you manage feedback and collaborate with your team
        </p>
      </div>

      <div className="rounded-lg border p-8">
        <CreateOrgForm />
      </div>
    </div>
  );
}
