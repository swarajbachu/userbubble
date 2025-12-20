import { getChangelogEntry, memberQueries } from "@userbubble/db/queries";
import { notFound, redirect } from "next/navigation";
import { getSession } from "~/auth/server";
import { getOrganization } from "~/lib/get-organization";
import { ChangelogEditor } from "../../_components/changelog-editor";

type EditChangelogPageProps = {
  params: Promise<{ org: string; id: string }>;
};

export default async function EditChangelogPage({
  params,
}: EditChangelogPageProps) {
  const { org, id } = await params;
  const organization = await getOrganization(org);
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  const member = await memberQueries.findByUserAndOrg(
    session.user.id,
    organization.id
  );

  if (!member) {
    notFound();
  }

  // Only admin/owner can edit changelog entries
  const canManage = ["owner", "admin"].includes(member.role);

  if (!canManage) {
    redirect(`/org/${org}/changelog`);
  }

  // Load the changelog entry
  const entry = await getChangelogEntry(id);

  if (!entry) {
    notFound();
  }

  // Ensure the entry belongs to this organization
  if (entry.organizationId !== organization.id) {
    notFound();
  }

  return (
    <ChangelogEditor
      entry={entry}
      mode="edit"
      org={org}
      organizationId={organization.id}
    />
  );
}
