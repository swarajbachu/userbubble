"use client";

import {
  Settings01Icon,
  SourceCodeIcon,
  UserIcon,
} from "@hugeicons-pro/core-bulk-rounded";
import { Button } from "@userbubble/ui/button";
import { CodeBlock, CopyButton, Section, StepSeparator } from "../step-section";

type StepInstallWidgetProps = {
  onDone: () => void;
};

const LOADER_SCRIPT = `<script src="https://widget.userbubble.com/widget.js" data-slug="YOUR_API_KEY" defer></script>`;

const CONFIG_CODE = `<script>
  window.ub.init('YOUR_API_KEY', {
    widget: true,
    position: 'right',
    theme: 'auto'
  });
</script>`;

const IDENTIFY_CODE = `<script>
  window.ub.identify({
    id: "USER_UNIQUE_ID",
    email: "user@example.com",
    firstName: "John",
    lastName: "Doe",
    avatar: "URL_TO_USER_AVATAR"
  });
</script>`;

export function StepInstallWidget({ onDone }: StepInstallWidgetProps) {
  return (
    <div>
      <p className="mb-6 text-muted-foreground">
        Get the Userbubble widget running on your website in under a minute
      </p>

      <Section
        action={<CopyButton value={LOADER_SCRIPT} />}
        description={
          "Add this single line to your HTML, just before the closing </body> tag"
        }
        icon={SourceCodeIcon}
        title="SDK Loader Script"
      >
        <CodeBlock code={LOADER_SCRIPT} numbered />
      </Section>

      <StepSeparator />

      <Section
        action={<CopyButton value={CONFIG_CODE} />}
        description="Add your project ID and customize the widget's appearance"
        icon={Settings01Icon}
        title="Configuration Code"
      >
        <CodeBlock code={CONFIG_CODE} numbered />
      </Section>

      <StepSeparator />

      <Section
        action={<CopyButton value={IDENTIFY_CODE} />}
        badge="Recommended"
        description="Link feedback to specific users for better tracking and communication"
        icon={UserIcon}
        title="User Identification"
      >
        <CodeBlock code={IDENTIFY_CODE} numbered />
        <div className="mt-4">
          <Button onClick={onDone} size="sm">
            I've installed the widget
          </Button>
        </div>
      </Section>
    </div>
  );
}
