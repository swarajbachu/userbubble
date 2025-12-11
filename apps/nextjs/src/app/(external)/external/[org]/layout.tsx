import { parseOrganizationSettings } from "@critichut/db/org/organization-settings";
import { getOrganization } from "~/lib/get-organization";
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

  // Use cached helper - follows Better Auth pattern
  const organization = await getOrganization(org);

  // Parse organization settings from metadata
  const settings = parseOrganizationSettings(organization.metadata);

  return (
    <BrandingProvider branding={settings.branding}>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <ExternalHeader
          logoUrl={settings.branding.logoUrl}
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
