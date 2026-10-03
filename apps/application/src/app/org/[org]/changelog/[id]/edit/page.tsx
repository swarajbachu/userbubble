import { notFound, redirect } from "next/navigation";
import { getOrgContext } from "~/lib/get-org-context";
import { getQueryClient, trpc } from "~/trpc/server";
import { ChangelogEditor } from "../../_components/changelog-editor";

type EditChangelogPageProps = {
  params: Promise<{ org: string; id: string }>;
};

export default async function EditChangelogPage({
  params,
}: EditChangelogPageProps) {
  const { org, id } = await params;
  const { organization, member } = await getOrgContext(org);

  if (!["owner", "admin"].includes(member.role)) {
    redirect(`/org/${org}/changelog`);
  }

  const entry = await getQueryClient()
    .fetchQuery(
      trpc.changelog.getById.queryOptions({
        id,
        organizationId: organization.id,
      })
    )
    .catch((error: unknown) => {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "NOT_FOUND"
      ) {
        return null;
      }
      throw error;
    });

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
