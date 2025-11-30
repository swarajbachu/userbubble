import { SidebarInset, SidebarProvider } from "@critichut/ui/sidebar";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "~/auth/server";
import { OrgSidebar } from "./_components/org-sidebar";

type OrgLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ org: string }>;
};

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { org } = await params;

  // Prefetch and get organization data
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
    query: {
      organizationSlug: org,
    },
  });

  if (!organization) {
    notFound();
  }

  await auth.api.setActiveOrganization({
    headers: await headers(),
    body: {
      organizationId: organization.id,
    },
  });

  return (
    <SidebarProvider>
      <OrgSidebar org={org} organizationName={organization.name} />
      {/* Main Content */}
      <SidebarInset>
        <main>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
