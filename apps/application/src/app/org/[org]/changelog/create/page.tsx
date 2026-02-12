import { permissions } from "@userbubble/db/queries";
import { redirect } from "next/navigation";
import { getOrgContext } from "~/lib/get-org-context";
import { ChangelogEditor } from "../_components/changelog-editor";

type CreateChangelogPageProps = {
  params: Promise<{ org: string }>;
};

export default async function CreateChangelogPage({
  params,
}: CreateChangelogPageProps) {
  const { org } = await params;
  const { organization, member } = await getOrgContext(org);

  if (!permissions.isAdmin(member.role)) {
    redirect(`/org/${org}/changelog`);
  }

  return (
    <ChangelogEditor mode="create" org={org} organizationId={organization.id} />
  );
}
