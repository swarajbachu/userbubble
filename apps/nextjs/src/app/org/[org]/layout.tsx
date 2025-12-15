import { SidebarInset, SidebarProvider } from "@userbubble/ui/sidebar";
import { headers } from "next/headers";
import { auth } from "~/auth/server";
import { getOrganization } from "~/lib/get-organization";
import { OrgSidebar } from "./_components/org-sidebar";

type OrgLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ org: string }>;
};

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { org } = await params;

  // Use cached helper - first call caches result for pages to reuse
  const organization = await getOrganization(org);

  await auth.api.setActiveOrganization({
    headers: await headers(),
    body: {
      organizationId: organization.id,
    },
  });

  return (
    <SidebarProvider>
      <OrgSidebar org={org} />
      {/* Main Content */}
      <SidebarInset>
        <main className="container mx-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
