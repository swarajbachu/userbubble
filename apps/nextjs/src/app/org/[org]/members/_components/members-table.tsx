"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons-pro/core-bulk-rounded";
import { Avatar, AvatarFallback, AvatarImage } from "@userbubble/ui/avatar";
import { Badge } from "@userbubble/ui/badge";
import { Input } from "@userbubble/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@userbubble/ui/table";
import { useState } from "react";
import { MemberActions } from "./member-actions";

type Member = {
  id: string;
  role: "owner" | "admin" | "member";
  userId: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

type Invitation = {
  id: string;
  email: string;
  role: "owner" | "admin" | "member";
  status: string;
  createdAt: Date;
};

type MembersTableProps = {
  members: Member[];
  invitations: Invitation[];
  organizationId: string;
  currentUserId: string;
  currentUserRole: "owner" | "admin" | "member";
  canManage: boolean;
};

export function MembersTable({
  members,
  invitations,
  organizationId,
  currentUserId,
  currentUserRole,
  canManage,
}: MembersTableProps) {
  const [search, setSearch] = useState("");

  const filteredMembers = members.filter(
    (m) =>
      m.user.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const pendingInvitations = invitations.filter((i) => i.status === "pending");

  return (
    <div className="space-y-8">
      {/* Search */}
      <div className="relative">
        <HugeiconsIcon
          className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          icon={Search01Icon}
          size={16}
        />
        <Input
          className="pl-9"
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          value={search}
        />
      </div>

      {/* Members Table */}
      <div>
        <h3 className="mb-4 font-semibold text-lg">Manage Members</h3>
        <p className="mb-4 text-muted-foreground text-sm">
          Members have access to your workspace.
        </p>

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                {canManage && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {member.user.image ? (
                          <AvatarImage
                            alt={member.user.name ?? ""}
                            src={member.user.image}
                          />
                        ) : (
                          <AvatarFallback>
                            {member.user.name?.[0]?.toUpperCase() ?? "?"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.user.name}</div>
                        <div className="text-muted-foreground text-sm">
                          {member.user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        member.role === "owner" ? "default" : "secondary"
                      }
                    >
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(member.createdAt).toLocaleDateString()}
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <MemberActions
                        currentUserId={currentUserId}
                        currentUserRole={currentUserRole}
                        member={member}
                        organizationId={organizationId}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div>
          <h3 className="mb-4 font-semibold text-lg">Invite Members</h3>
          <p className="mb-4 text-muted-foreground text-sm">
            Invite a new member to your workspace.
          </p>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{invitation.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{invitation.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
