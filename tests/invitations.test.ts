import { describe, expect, it } from "vitest";
import { account, local } from "./helpers/live";

describe.skipIf(!local)("recipient invitation ceremony", () => {
  it("binds acceptance to the invited user and rejects cancelled invitations", async () => {
    const owner = await account();
    const recipient = await account();
    const outsider = await account();
    const invitation = (
      await (
        await owner.call("/api/v2/operations/organization.invite", {
          organizationId: owner.organizationId,
          email: recipient.email,
          role: "member",
        })
      ).json()
    ).data;
    expect(typeof invitation.id).toBe("string");
    const wrongUser = await outsider.call(
      "/api/auth/organization/accept-invitation",
      { invitationId: invitation.id }
    );
    expect(wrongUser.ok).toBe(false);
    const accepted = await recipient.call(
      "/api/auth/organization/accept-invitation",
      { invitationId: invitation.id }
    );
    expect(accepted.status, await accepted.text()).toBe(200);
    const members = (
      await (
        await owner.call("/api/v2/operations/settings.listMembers", {
          organizationId: owner.organizationId,
        })
      ).json()
    ).data;
    expect(
      members.some(
        (member: { user: { email: string }; role: string }) =>
          member.user.email === recipient.email && member.role === "member"
      )
    ).toBe(true);
    const cancelled = (
      await (
        await owner.call("/api/v2/operations/organization.invite", {
          organizationId: owner.organizationId,
          email: outsider.email,
          role: "member",
        })
      ).json()
    ).data;
    expect(
      (
        await owner.call("/api/v2/operations/organization.cancelInvitation", {
          organizationId: owner.organizationId,
          invitationId: cancelled.id,
        })
      ).ok
    ).toBe(true);
    expect(
      (
        await outsider.call("/api/auth/organization/accept-invitation", {
          invitationId: cancelled.id,
        })
      ).ok
    ).toBe(false);
  }, 180_000);
});
