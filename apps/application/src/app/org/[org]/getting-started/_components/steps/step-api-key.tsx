"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiChat02Icon,
  CheckmarkCircle01Icon,
  Copy01Icon,
  Key01Icon,
  Link01Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Organization } from "@userbubble/db/schema";
import { Button } from "@userbubble/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import { CodeBlock, CopyButton, Section, StepSeparator } from "../step-section";

type StepApiKeyProps = {
  organization: Organization;
  orgSlug: string;
  onDone: () => void;
  onApiKeyCreated: (key: string) => void;
};

function generateAIPrompt(orgSlug: string, apiKey: string): string {
  return `I need help integrating the Userbubble feedback widget into my web application.

## About Userbubble
Userbubble is an embeddable feedback widget that lets users submit feedback, feature requests, and bug reports directly from your app.

## My Details
- Organization slug: ${orgSlug}
- API Key: ${apiKey}

## Installation Options

### Option 1: Script Tag (simplest)
Add this to your HTML before \`</body>\`:
\`\`\`html
<script src="https://unpkg.com/@userbubble/web/dist/userbubble.min.js"></script>
<script>
  Userbubble.init({ apiKey: '${apiKey}' });
</script>
\`\`\`

### Option 2: npm Package
\`\`\`bash
npm install @userbubble/web
\`\`\`

Then initialize in your app:
\`\`\`javascript
import Userbubble from '@userbubble/web';

Userbubble.init({ apiKey: '${apiKey}' });
\`\`\`

### Option 3: React
\`\`\`bash
npm install @userbubble/web
\`\`\`

Then add the provider to your app:
\`\`\`jsx
import { UserbubbleProvider, UserbubbleWidget } from '@userbubble/web/react';

function App() {
  return (
    <UserbubbleProvider config={{ apiKey: '${apiKey}' }}>
      <MyApp />
      <UserbubbleWidget />
    </UserbubbleProvider>
  );
}
\`\`\`

## User Identification (recommended)
To link feedback to specific users:
\`\`\`javascript
Userbubble.identify({
  id: 'user_123',
  email: 'user@example.com',
  name: 'Jane Doe',
});
\`\`\`

## Configuration Options
| Option | Type | Description |
|--------|------|-------------|
| apiKey | string | Your API key (required) |
| theme | "light" \\| "dark" \\| "auto" | Widget theme |
| position | "bottom-right" \\| "bottom-left" | Widget button position |
| accentColor | string | Brand accent color (hex) |
| locale | string | Language locale |

## Full Documentation
For complete API reference and examples, fetch: https://docs.userbubble.com/llms-full.txt

## Task
Please help me integrate Userbubble into my project. Ask me about my tech stack and guide me through the best installation method for my setup.`;
}

export function StepApiKey({
  organization,
  orgSlug,
  onDone,
  onApiKeyCreated,
}: StepApiKeyProps) {
  const trpc = useTRPC();
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);

  const { data: apiKeys, refetch } = useQuery(
    trpc.apiKey.list.queryOptions({
      organizationId: organization.id,
    })
  );

  const createKey = useMutation(
    trpc.apiKey.create.mutationOptions({
      onSuccess: (data) => {
        setRawKey(data.rawKey);
        onApiKeyCreated(data.rawKey);
        onDone();
        void refetch();
        toast.success("API key created");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create API key");
      },
    })
  );

  const hasExistingKeys = apiKeys && apiKeys.length > 0;
  const boardUrl = `https://${orgSlug}.userbubble.com/`;

  const getDescription = () => {
    if (rawKey) {
      return "Save this key now — you won't be able to see it again.";
    }
    if (hasExistingKeys) {
      return "You already have an API key. Manage keys in Settings.";
    }
    return "Generate a key to connect the widget to your organization.";
  };

  const renderKeyContent = () => {
    if (rawKey) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
            <code className="flex-1 overflow-x-auto font-mono text-sm">
              {rawKey}
            </code>
            <CopyButton value={rawKey} />
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
            <p className="font-medium text-amber-900 text-xs dark:text-amber-100">
              Save this key securely — it won't be shown again.
            </p>
          </div>
        </div>
      );
    }
    if (hasExistingKeys) {
      return (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
          <HugeiconsIcon
            className="text-green-500"
            icon={CheckmarkCircle01Icon}
            size={18}
          />
          <span className="text-sm">
            Active key: ••••{apiKeys[0]?.keyPreview}
          </span>
        </div>
      );
    }
    return (
      <Button disabled={createKey.isPending} onClick={handleGenerate}>
        <HugeiconsIcon className="mr-2" icon={Key01Icon} size={16} />
        {createKey.isPending ? "Generating..." : "Generate API Key"}
      </Button>
    );
  };

  const handleGenerate = () => {
    createKey.mutate({
      organizationId: organization.id,
      name: "Default",
    });
  };

  const handleVisitBoard = () => {
    onDone();
    window.open(boardUrl, "_blank", "noopener");
  };

  const copyPrompt = async () => {
    const key = rawKey || "YOUR_API_KEY";
    const prompt = generateAIPrompt(orgSlug, key);
    await navigator.clipboard.writeText(prompt);
    setPromptCopied(true);
    toast.success("AI prompt copied to clipboard");
    setTimeout(() => setPromptCopied(false), 2000);
  };

  return (
    <div>
      <p className="mb-6 text-muted-foreground">
        Create an API key to authenticate the Userbubble widget on your site.
      </p>

      {/* Part A: API Key */}
      <Section description={getDescription()} icon={Key01Icon} title="API Key">
        {renderKeyContent()}
      </Section>

      <StepSeparator />

      {/* Part B: Board URL */}
      <Section
        action={
          <div className="flex gap-2">
            <Button onClick={handleVisitBoard} size="sm" variant="outline">
              Visit
            </Button>
            <CopyButton onCopy={onDone} value={boardUrl} />
          </div>
        }
        description="Your public feedback board URL with feedback, roadmap, and changelog"
        icon={Link01Icon}
        title="Board URL"
      >
        <CodeBlock code={boardUrl} />
        <p className="mt-2 text-muted-foreground/60 text-xs">
          Custom domains coming soon
        </p>
      </Section>

      <StepSeparator />

      {/* Part C: AI Setup Prompt */}
      <Section
        action={
          <Button onClick={copyPrompt} size="sm" variant="outline">
            <HugeiconsIcon
              className="mr-1"
              icon={promptCopied ? CheckmarkCircle01Icon : Copy01Icon}
              size={14}
            />
            {promptCopied ? "Copied" : "Copy prompt"}
          </Button>
        }
        description="Copy this prompt into Claude, ChatGPT, or Cursor for guided integration help"
        icon={AiChat02Icon}
        title="Setup with AI"
      >
        <div className="max-h-48 overflow-y-auto rounded-lg border bg-muted/50 p-4">
          <pre className="whitespace-pre-wrap font-mono text-muted-foreground text-xs leading-relaxed">
            {generateAIPrompt(orgSlug, rawKey || "YOUR_API_KEY")}
          </pre>
        </div>
      </Section>
    </div>
  );
}
