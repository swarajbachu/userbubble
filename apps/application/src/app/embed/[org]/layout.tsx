import { parseOrganizationSettings } from "@userbubble/db/org/organization-settings";
import { Suspense } from "react";
import { getPublicOrganization } from "~/lib/get-organization";
import { BrandingProvider } from "../_components/branding-provider";
import { EmbedBridge } from "../_components/embed-bridge";
import { EmbedTabBar } from "../_components/embed-tab-bar";

type EmbedLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ org: string }>;
};

export default async function EmbedLayout({
  children,
  params,
}: EmbedLayoutProps) {
  const { org } = await params;
  const organization = await getPublicOrganization(org);
  const settings = parseOrganizationSettings(organization.metadata);

  return (
    <BrandingProvider branding={settings.branding}>
      <Suspense>
        <EmbedBridge />
      </Suspense>
      <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
        <main className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </main>
        <EmbedTabBar
          enableRoadmap={settings.feedback?.enableRoadmap ?? true}
          orgSlug={org}
        />
      </div>
    </BrandingProvider>
  );
}
