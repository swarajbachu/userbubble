"use client";

import { UserAdd01Icon } from "@hugeicons-pro/core-bulk-rounded";
import { Button } from "@userbubble/ui/button";
import { Input } from "@userbubble/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "~/auth/client";
import { Section } from "../step-section";

type StepInviteTeamProps = {
  orgId: string;
  onDone: () => void;
};

export function StepInviteTeam({ orgId, onDone }: StepInviteTeamProps) {
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) {
      return;
    }
    setIsInviting(true);
    try {
      const { error } = await authClient.organization.inviteMember({
        email: email.trim(),
        role: "member",
        organizationId: orgId,
      });

      if (error) {
        toast.error(error.message || "Failed to send invitation");
        return;
      }

      toast.success(`Invitation sent to ${email}`);
      setEmail("");
      onDone();
    } catch (_err) {
      toast.error("Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div>
      <p className="mb-6 text-muted-foreground">
        Invite team members to help manage feedback, roadmap, and changelog
      </p>

      <Section
        description="Enter email addresses to invite team members to your workspace"
        icon={UserAdd01Icon}
        title="Add Team Members"
      >
        <div className="mt-2 flex items-center gap-2">
          <Input
            className="flex-1"
            disabled={isInviting}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleInvite();
              }
            }}
            placeholder="teammate@example.com"
            type="email"
            value={email}
          />
          <Button
            disabled={!email.trim() || isInviting}
            onClick={handleInvite}
            size="sm"
            variant="outline"
          >
            {isInviting ? "Sending..." : "Invite"}
          </Button>
        </div>
      </Section>
    </div>
  );
}
