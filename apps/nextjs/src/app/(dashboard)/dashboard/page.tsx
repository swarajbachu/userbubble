import { organizationQueries } from "@critichut/db/queries";
import { Button } from "@critichut/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/sign-in");
  }

  // Fetch user's organization memberships
  const memberships = await organizationQueries.listUserOrganizations(
    session.user.id
  );

  // If no orgs (shouldn't happen due to middleware, but defensive)
  if (memberships.length === 0) {
    redirect("/onboarding/create-org");
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <div className="mb-8">
        <h1 className="mb-2 font-bold text-4xl">Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          Manage your organizations and feedback
        </p>
      </div>

      {/* Organizations list */}
      <div className="rounded-lg border p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-semibold text-2xl">Your Organizations</h2>
        </div>

        <div className="space-y-4">
          {memberships.map((membership) => (
            <Link
              className="block rounded-lg border p-6 transition-colors hover:bg-muted"
              href={`/${membership.organization.slug}/feedback`}
              key={membership.organization.id}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {membership.organization.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-4 text-muted-foreground text-sm">
                    <span className="capitalize">{membership.role}</span>
                    <span>•</span>
                    <span className="font-mono text-xs">
                      {membership.organization.slug}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  View →
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* User info */}
      <div className="mt-8 rounded-lg border p-6">
        <h2 className="mb-4 font-semibold text-xl">Account</h2>
        <div className="space-y-2">
          <p className="text-sm">
            <span className="text-muted-foreground">Name:</span>{" "}
            <span className="font-medium">{session.user.name}</span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Email:</span>{" "}
            <span className="font-medium">{session.user.email}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
