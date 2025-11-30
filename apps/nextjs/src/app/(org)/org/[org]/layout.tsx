import { SidebarProvider } from "@critichut/ui/sidebar";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "~/auth/server";
import { MobileNav } from "./_components/mobile-nav";
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
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden border-r md:block">
          <OrgSidebar org={org} organizationName={organization.name} />
        </aside>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <MobileNav org={org} organizationName={organization.name} />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-8 md:px-8">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
