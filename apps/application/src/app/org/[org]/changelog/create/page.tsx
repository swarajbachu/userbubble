import { memberQueries } from "@userbubble/db/queries";
import { notFound, redirect } from "next/navigation";
import { getSession } from "~/auth/server";
import { getOrganization } from "~/lib/get-organization";
import { ChangelogEditor } from "../_components/changelog-editor";

type CreateChangelogPageProps = {
  params: Promise<{ org: string }>;
};

export default async function CreateChangelogPage({
  params,
}: CreateChangelogPageProps) {
  const { org } = await params;
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

  // Only admin/owner can create changelog entries
  const canManage = ["owner", "admin"].includes(member.role);

  if (!canManage) {
    redirect(`/org/${org}/changelog`);
  }

  return (
    <ChangelogEditor mode="create" org={org} organizationId={organization.id} />
  );
}
