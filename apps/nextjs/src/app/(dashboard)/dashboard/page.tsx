import { organizationQueries } from "@critichut/db/queries";
import { Icon } from "@critichut/ui/icon";
import {
  ArrowRight01Icon,
  Building04Icon,
  UserCircleIcon,
} from "@hugeicons-pro/core-bulk-rounded";
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
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-bold text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your organizations and account
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <div className="mb-4 flex items-center gap-2 px-1">
            <Icon
              className="text-muted-foreground"
              icon={Building04Icon}
              size={18}
            />
            <h2 className="font-semibold text-sm">Your Organizations</h2>
          </div>

          <div className="flex flex-col p-2">
            {memberships.map((membership) => (
              <Link
                className="group flex items-center justify-between gap-4 border-x border-b p-3 transition-all first:rounded-t-2xl first:border-t last:rounded-b-2xl hover:bg-muted/50"
                href={`/${membership.organization.slug}/feedback`}
                key={membership.organization.id}
              >
                <div className="flex flex-col gap-1">
                  <h3 className="font-medium text-sm transition-colors group-hover:text-primary">
                    {membership.organization.name}
                  </h3>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <span className="capitalize">{membership.role}</span>
                    <span>•</span>
                    <span className="font-mono">
                      {membership.organization.slug}
                    </span>
                  </div>
                </div>
                <Icon
                  className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                  icon={ArrowRight01Icon}
                  size={16}
                />
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2 px-1">
            <Icon
              className="text-muted-foreground"
              icon={UserCircleIcon}
              size={18}
            />
            <h2 className="font-semibold text-sm">Account</h2>
          </div>

          <div className="flex flex-col p-2">
            <div className="flex items-center gap-4 rounded-2xl border p-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <span className="font-bold text-lg text-primary">
                  {session.user.name?.[0]?.toUpperCase() ?? "U"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-medium text-sm">{session.user.name}</p>
                <p className="text-muted-foreground text-xs">
                  {session.user.email}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
