import { getOrgContext } from "~/lib/get-org-context";
import { getQueryClient, trpc } from "~/trpc/server";
import { InviteMemberButton } from "./_components/invite-member-button";
import { MembersTable } from "./_components/members-table";

type MembersPageProps = {
  params: Promise<{ org: string }>;
};

export default async function MembersPage({ params }: MembersPageProps) {
  const { org } = await params;
  const { organization, session, member } = await getOrgContext(org);

  const queryClient = getQueryClient();
  const role = await queryClient.fetchQuery(
    trpc.settings.getMyRole.queryOptions({ organizationId: organization.id })
  );
  const canManage = role === "owner" || role === "admin";
  const [members, invitations] = await Promise.all([
    queryClient.fetchQuery(
      trpc.settings.listMembers.queryOptions({
        organizationId: organization.id,
      })
    ),
    canManage
      ? queryClient.fetchQuery(
          trpc.organization.listInvitations.queryOptions({
            organizationId: organization.id,
          })
        )
      : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-lg">Members</h1>
          <p className="text-muted-foreground text-sm">
            View and manage your team members.
          </p>
        </div>
        {canManage && <InviteMemberButton organizationId={organization.id} />}
      </div>

      <MembersTable
        canManage={canManage}
        currentUserId={session.user.id}
        currentUserRole={member.role}
        invitations={invitations}
        members={members}
        organizationId={organization.id}
      />
    </div>
  );
}
