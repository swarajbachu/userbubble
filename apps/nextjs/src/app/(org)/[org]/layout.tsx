import { notFound } from "next/navigation";
import { trpc } from "~/trpc/server";

type OrgLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ org: string }>;
};

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { org } = await params;

  // Fetch organization to verify it exists
  const organization = await trpc.organization.getBySlug({ slug: org });

  if (!organization) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Org-specific navigation */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <h1 className="font-semibold text-xl">{organization.name}</h1>
            <nav className="flex gap-6">
              <a
                className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                href={`/${org}/feedback`}
              >
                Feedback
              </a>
              <a
                className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                href={`/${org}/roadmap`}
              >
                Roadmap
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {/* User menu will go here */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
