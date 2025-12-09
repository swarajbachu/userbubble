import { organizationQueries } from "@critichut/db/queries";
import { parseOrganizationSettings } from "@critichut/db/schema";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { BrandingProvider } from "../_components/branding-provider";
import { ExternalHeader } from "../_components/external-header";
import { ExternalNav } from "../_components/external-nav";

type ExternalOrgLayoutProps = {
  children: ReactNode;
  params: Promise<{ org: string }>;
};

export default async function ExternalOrgLayout({
  children,
  params,
}: ExternalOrgLayoutProps) {
  const { org } = await params;
  console.log("org", org);
  const organization = await organizationQueries.findBySlug(org);
  console.log("organization", organization);

  if (!organization) {
    notFound();
  }

  const settings = parseOrganizationSettings(organization.metadata);

  return (
    <BrandingProvider
      branding={settings.branding}
      organizationName={organization.name}
    >
      <div className="min-h-screen bg-background">
        <ExternalHeader organization={organization} settings={settings} />
        <ExternalNav org={org} />
        <main className="container mx-auto max-w-7xl px-4 py-8">
          {children}
        </main>
        <footer className="mt-16 border-t">
          <div className="container mx-auto max-w-7xl px-4 py-6">
            <p className="text-center text-muted-foreground text-sm">
              Powered by{" "}
              <a
                className="transition-colors hover:text-foreground"
                href="https://critichut.com"
                rel="noopener noreferrer"
                target="_blank"
              >
                CriticHut
              </a>
            </p>
          </div>
        </footer>
      </div>
    </BrandingProvider>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const organization = await organizationQueries.findBySlug(org);

  if (!organization) {
    return {
      title: "Organization Not Found",
    };
  }

  return {
    title: `${organization.name} - Feedback Portal`,
    description: `Share your ideas, vote on features, and see what ${organization.name} is building next`,
  };
}
