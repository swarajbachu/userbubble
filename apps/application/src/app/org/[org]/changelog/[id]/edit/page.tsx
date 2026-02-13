import { getChangelogEntry, permissions } from "@userbubble/db/queries";
import { notFound, redirect } from "next/navigation";
import { getOrgContext } from "~/lib/get-org-context";
import { ChangelogEditor } from "../../_components/changelog-editor";

type EditChangelogPageProps = {
  params: Promise<{ org: string; id: string }>;
};

export default async function EditChangelogPage({
  params,
}: EditChangelogPageProps) {
  const { org, id } = await params;
  const { organization, member } = await getOrgContext(org);

  if (!permissions.isAdmin(member.role)) {
    redirect(`/org/${org}/changelog`);
  }

  const entry = await getChangelogEntry(id);

  if (!entry) {
    notFound();
  }

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
