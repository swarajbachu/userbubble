"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons-pro/core-duotone-rounded";
import { Checkbox } from "@userbubble/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@userbubble/ui/collapsible";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@userbubble/ui/dialog";
import { Label } from "@userbubble/ui/label";
import { useState } from "react";
import { CopyButton } from "./copy-button";
import { SetupWithAIDialog } from "./setup-with-ai-dialog";
import { useWizard } from "./wizard-context";

const SCRIPT_TAG_SNIPPET = `<script
  src="https://widget.userbubble.com/widget.js"
  data-slug="YOUR_API_KEY"
  defer
></script>`;

const NPM_INSTALL_SNIPPET = "npm install @userbubble/js";

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

function CodeSnippet({ code, label }: { code: string; label: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="flex items-start gap-2">
        <pre className="flex-1 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
          {code}
        </pre>
        <CopyButton label="Copy" value={code} />
      </div>
    </div>
  );
}

function InstallWidgetSection() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible onOpenChange={setOpen} open={open}>
      <div className="flex items-center space-x-2">
        <Checkbox id="install-widget" />
        <CollapsibleTrigger className="flex flex-1 items-center gap-1">
          <Label
            className="cursor-pointer font-normal text-sm leading-none"
            htmlFor="install-widget"
          >
            Install the widget
          </Label>
          <HugeiconsIcon
            className="text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180"
            icon={ArrowDown01Icon}
            size={14}
            style={{
              transform: open ? "rotate(180deg)" : undefined,
            }}
          />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="mt-3 space-y-4 pl-6">
          <CodeSnippet code={SCRIPT_TAG_SNIPPET} label="Script tag" />
          <CodeSnippet code={NPM_INSTALL_SNIPPET} label="npm" />
          <p className="text-muted-foreground text-xs">
            Replace <code className="text-foreground">YOUR_API_KEY</code> with
            your API key from Settings.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function OnboardingChecklistModal() {
  const { showChecklist, closeChecklist, slug, website } = useWizard();

  return (
    <Dialog onOpenChange={closeChecklist} open={showChecklist}>
      <DialogPopup className="max-w-3xl pt-4">
        <DialogHeader>
          <DialogTitle>Get started</DialogTitle>
          <DialogDescription>
            Complete these steps to get the most out of your feedback board
          </DialogDescription>
        </DialogHeader>

        <DialogPanel>
          <div className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Setup Column */}
              <div className="space-y-4">
                <h3 className="font-semibold">Setup</h3>
                <div className="space-y-3">
                  <ChecklistItem id="setup-domain" label="Setup Domain" />
                  <InstallWidgetSection />
                  <ChecklistItem id="auto-login" label="Enable auto-login" />
                  <ChecklistItem
                    id="guest-submissions"
                    label="Guest submissions"
                  />
                </div>
                <div className="pt-2">
                  <SetupWithAIDialog slug={slug} website={website} />
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
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}
