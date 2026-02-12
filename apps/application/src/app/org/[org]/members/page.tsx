import {
  invitationQueries,
  memberQueries,
  permissions,
} from "@userbubble/db/queries";
import { Suspense } from "react";
import { getOrgContext } from "~/lib/get-org-context";
import { InviteMemberButton } from "./_components/invite-member-button";
import { MembersTable } from "./_components/members-table";

type MembersPageProps = {
  params: Promise<{ org: string }>;
};

export default async function MembersPage({ params }: MembersPageProps) {
  const { org } = await params;
  const { organization, session, member } = await getOrgContext(org);

  const [members, invitations] = await Promise.all([
    memberQueries.listByOrganization(organization.id),
    invitationQueries.listByOrganization(organization.id),
  ]);

  const canManage = permissions.canManageMembers(member.role);

  return (
    <div className="mx-auto w-full max-w-4xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Members</h1>
          <p className="text-muted-foreground text-sm">
            View and manage your team members.
          </p>
        </div>
        {canManage && <InviteMemberButton organizationId={organization.id} />}
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <MembersTable
          canManage={canManage}
          currentUserId={session.user.id}
          currentUserRole={member.role}
          invitations={invitations}
          members={members}
          organizationId={organization.id}
        />
      </Suspense>
    </div>
  );
}
