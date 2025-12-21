import { parseOrganizationSettings } from "@userbubble/db/org/organization-settings";
import { memberQueries } from "@userbubble/db/queries";
import { getSession } from "~/auth/server";
import { getPublicOrganization } from "~/lib/get-organization";
import { BrandingProvider } from "../_components/branding-provider";
import { ExternalHeader } from "../_components/external-header";

type ExternalLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ org: string }>;
};

export default async function ExternalLayout({
  children,
  params,
}: ExternalLayoutProps) {
  const { org } = await params;

  // Use public helper - no auth required for external routes
  const organization = await getPublicOrganization(org);

  // Parse organization settings from metadata
  const settings = parseOrganizationSettings(organization.metadata);

  // Get session and member role
  const session = await getSession();
  const userId = session?.user?.id;

  let memberRole: "admin" | "owner" | "member" | null = null;
  if (userId) {
    const member = await memberQueries.findByUserAndOrg(
      userId,
      organization.id
    );
    memberRole = member?.role ?? null;
  }

  return (
    <BrandingProvider branding={settings.branding}>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <ExternalHeader
          allowAnonymous={settings.publicAccess.allowAnonymousSubmissions}
          enableRoadmap={settings.feedback?.enableRoadmap ?? true}
          logoUrl={settings.branding.logoUrl}
          memberRole={memberRole}
          organizationId={organization.id}
          organizationName={organization.name}
          orgSlug={org}
        />
        <main className="container mx-auto max-w-7xl flex-1 px-4 py-8">
          {children}
        </main>
      </div>
    </BrandingProvider>
  );
}
