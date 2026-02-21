"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiChat02Icon,
  CheckmarkCircle01Icon,
  Copy01Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import { Button } from "@userbubble/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@userbubble/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";

function generateAIPrompt(slug: string, website: string): string {
  return `I need help integrating the Userbubble feedback widget into my web application.

## About Userbubble
Userbubble is an embeddable feedback widget that lets users submit feedback, feature requests, and bug reports directly from your app.

## My Details
- Organization slug: ${slug}
- Website: ${website || "(not set)"}

## Installation Options

### Option 1: Script Tag (simplest)
Add this to your HTML \`<head>\` or before \`</body>\`:
\`\`\`html
<script
  src="https://widget.userbubble.com/widget.js"
  data-slug="${slug}"
  defer
></script>
\`\`\`

### Option 2: npm Package
\`\`\`bash
npm install @userbubble/js
\`\`\`

Then initialize in your app:
\`\`\`javascript
import { Userbubble } from "@userbubble/js";

const ub = new Userbubble({
  slug: "${slug}",
});
\`\`\`

### Option 3: React Component
\`\`\`bash
npm install @userbubble/react
\`\`\`

Then add the provider to your app:
\`\`\`jsx
import { UserbubbleProvider } from "@userbubble/react";

function App({ children }) {
  return (
    <UserbubbleProvider slug="${slug}">
      {children}
    </UserbubbleProvider>
  );
}
\`\`\`

## User Identification (optional)
To identify logged-in users so their feedback is attributed:
\`\`\`javascript
ub.identify({
  id: "user_123",
  email: "user@example.com",
  name: "Jane Doe",
});
\`\`\`

## Configuration Options
| Option | Type | Description |
|--------|------|-------------|
| slug | string | Your organization slug (required) |
| theme | "light" \\| "dark" \\| "auto" | Widget theme |
| position | "bottom-right" \\| "bottom-left" | Widget button position |
| locale | string | Language locale |

## Full Documentation
For complete API reference and examples, fetch: https://docs.userbubble.com/llms-full.txt

## Task
Please help me integrate Userbubble into my project. Ask me about my tech stack and guide me through the best installation method for my setup.`;
}

type SetupWithAIDialogProps = {
  slug: string;
  website: string;
};

export function SetupWithAIDialog({ slug, website }: SetupWithAIDialogProps) {
  const [copied, setCopied] = useState(false);
  const prompt = generateAIPrompt(slug, website);

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success("Prompt copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger>
        <Button size="sm" variant="outline">
          <HugeiconsIcon className="mr-2" icon={AiChat02Icon} size={16} />
          Setup with AI
        </Button>
      </DialogTrigger>
      <DialogPopup className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Setup with AI</DialogTitle>
          <DialogDescription>
            Copy the prompt below and paste it into your favorite AI assistant
            (ChatGPT, Claude, etc.) for guided setup help.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <div className="space-y-4">
            <div className="max-h-64 overflow-y-auto rounded-lg bg-muted p-4">
              <pre className="whitespace-pre-wrap font-mono text-xs">
                {prompt}
              </pre>
            </div>
            <Button className="w-full" onClick={copyPrompt} variant="outline">
              {copied ? (
                <>
                  <HugeiconsIcon
                    className="mr-2"
                    icon={CheckmarkCircle01Icon}
                    size={16}
                  />
                  Copied!
                </>
              ) : (
                <>
                  <HugeiconsIcon className="mr-2" icon={Copy01Icon} size={16} />
                  Copy prompt
                </>
              )}
            </Button>
          </div>
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}
