import { permissions } from "@userbubble/db/queries";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getOrgContextWithMetadata } from "~/lib/get-org-context";
import { SettingsTabs } from "./_components/settings-tabs";

type SettingsPageProps = {
  params: Promise<{ org: string }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { org } = await params;
  const { organization, member } = await getOrgContextWithMetadata(org);

  if (!permissions.canManageSettings(member.role)) {
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
