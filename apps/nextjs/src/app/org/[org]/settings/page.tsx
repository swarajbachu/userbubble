import { memberQueries, organizationQueries } from "@userbubble/db/queries";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "~/auth/server";
import { SettingsTabs } from "./_components/settings-tabs";

type SettingsPageProps = {
  params: Promise<{ org: string }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { org } = await params;
  // Use direct DB query to get full organization with all fields
  const organization = await organizationQueries.findBySlug(org);
  const session = await getSession();

  if (!organization) {
    notFound();
  }

  if (!session) {
    redirect("/sign-in");
  }

  // Check if user is member
  const member = await memberQueries.findByUserAndOrg(
    session.user.id,
    organization.id
  );

  if (!member) {
    notFound();
  }

  // Only owners and admins can access settings
  const canManage = ["owner", "admin"].includes(member.role);
  if (!canManage) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="font-bold text-3xl">Settings</h1>
        <p className="text-muted-foreground text-sm">
          View and manage your workspace settings.
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <SettingsTabs organization={organization} userRole={member.role} />
      </Suspense>
    </div>
  );
}
