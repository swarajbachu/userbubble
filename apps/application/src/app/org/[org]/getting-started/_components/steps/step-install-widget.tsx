"use client";

import { SourceCodeIcon, UserIcon } from "@hugeicons-pro/core-bulk-rounded";
import { cn } from "@userbubble/ui";
import { useState } from "react";
import { CodeBlock, CopyButton, Section, StepSeparator } from "../step-section";

type StepInstallWidgetProps = {
  onDone: () => void;
  apiKey?: string | null;
};

const KEY_PLACEHOLDER = "YOUR_API_KEY";

const SCRIPT_IDENTIFY = `Userbubble.identify({
  id: 'USER_ID',
  email: 'user@example.com',
  name: 'Jane Doe',
});`;

const REACT_INSTALL = "npm install @userbubble/web";

const REACT_IDENTIFY = `const { identify } = useUserbubble();
await identify({ id: 'USER_ID', email: 'user@example.com', name: 'Jane Doe' });`;

type Tab = "script" | "react";

function getScriptSnippet(key: string) {
  return `<script src="https://unpkg.com/@userbubble/web/dist/userbubble.min.js"></script>
<script>
  Userbubble.init({ apiKey: '${key}' });
</script>`;
}

function getReactSnippet(key: string) {
  return `import { UserbubbleProvider, UserbubbleWidget } from '@userbubble/web/react';

function App() {
  return (
    <UserbubbleProvider config={{ apiKey: '${key}' }}>
      <MyApp />
      <UserbubbleWidget />
    </UserbubbleProvider>
  );
}`;
}

export function StepInstallWidget({ onDone, apiKey }: StepInstallWidgetProps) {
  const [activeTab, setActiveTab] = useState<Tab>("script");
  const key = apiKey || KEY_PLACEHOLDER;
  const scriptSnippet = getScriptSnippet(key);
  const reactSnippet = getReactSnippet(key);

  const handleCopy = () => {
    onDone();
  };

  return (
    <div>
      <p className="mb-6 text-muted-foreground">
        Get the Userbubble widget running on your website in under a minute
      </p>

      {!apiKey && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
          <p className="text-amber-900 text-xs dark:text-amber-100">
            Go back to Step 1 to generate an API key and replace the placeholder
            below.
          </p>
        </div>
      )}

      {/* Tab switcher */}
      <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
        <button
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 font-medium text-sm transition-colors",
            activeTab === "script"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("script")}
          type="button"
        >
          Script Tag
        </button>
        <button
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 font-medium text-sm transition-colors",
            activeTab === "react"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("react")}
          type="button"
        >
          React
        </button>
      </div>

      {activeTab === "script" && (
        <>
          <Section
            action={<CopyButton onCopy={handleCopy} value={scriptSnippet} />}
            description="Add this snippet to your HTML, just before the closing </body> tag"
            icon={SourceCodeIcon}
            title="Add the SDK"
          >
            <CodeBlock code={scriptSnippet} numbered />
          </Section>

          <StepSeparator />

          <Section
            action={<CopyButton onCopy={handleCopy} value={SCRIPT_IDENTIFY} />}
            badge="Recommended"
            description="Link feedback to specific users for better tracking"
            icon={UserIcon}
            title="Identify Users"
          >
            <CodeBlock code={SCRIPT_IDENTIFY} numbered />
          </Section>
        </>
      )}

      {activeTab === "react" && (
        <>
          <Section
            action={<CopyButton onCopy={handleCopy} value={REACT_INSTALL} />}
            description="Install the SDK package"
            icon={SourceCodeIcon}
            title="Install"
          >
            <CodeBlock code={REACT_INSTALL} />
          </Section>

          <StepSeparator />

          <Section
            action={<CopyButton onCopy={handleCopy} value={reactSnippet} />}
            description="Wrap your app with the provider and add the widget"
            icon={SourceCodeIcon}
            title="Add the Provider"
          >
            <CodeBlock code={reactSnippet} numbered />
          </Section>

          <StepSeparator />

          <Section
            action={<CopyButton onCopy={handleCopy} value={REACT_IDENTIFY} />}
            badge="Recommended"
            description="Link feedback to specific users for better tracking"
            icon={UserIcon}
            title="Identify Users"
          >
            <CodeBlock code={REACT_IDENTIFY} numbered />
          </Section>
        </>
      )}
    </div>
  );
}
