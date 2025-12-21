"use client";

import { Checkbox } from "@userbubble/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@userbubble/ui/dialog";
import { Label } from "@userbubble/ui/label";
import { useWizard } from "./wizard-context";

type ChecklistItemProps = {
  id: string;
  label: string;
};

function ChecklistItem({ id, label }: ChecklistItemProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id={id} />
      <Label
        className="cursor-pointer font-normal text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        htmlFor={id}
      >
        {label}
      </Label>
    </div>
  );
}

export function OnboardingChecklistModal() {
  const { showChecklist, closeChecklist } = useWizard();

  return (
    <Dialog onOpenChange={closeChecklist} open={showChecklist}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Get started</DialogTitle>
          <DialogDescription>
            Complete these steps to get the most out of your feedback board
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Setup Column */}
            <div className="space-y-4">
              <h3 className="font-semibold">Setup</h3>
              <div className="space-y-3">
                <ChecklistItem id="setup-domain" label="Setup Domain" />
                <ChecklistItem id="install-widget" label="Install the widget" />
                <ChecklistItem id="auto-login" label="Enable auto-login" />
                <ChecklistItem
                  id="guest-submissions"
                  label="Guest submissions"
                />
              </div>
            </div>

            {/* Customize Column */}
            <div className="space-y-4">
              <h3 className="font-semibold">Customize</h3>
              <div className="space-y-3">
                <ChecklistItem id="invite-team" label="Invite your team" />
                <ChecklistItem
                  id="customize-branding"
                  label="Customize branding"
                />
                <ChecklistItem id="share-board" label="Share your board" />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
