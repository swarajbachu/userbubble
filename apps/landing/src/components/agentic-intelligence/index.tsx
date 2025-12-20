"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiBeautifyIcon,
  CodeCircleDuotoneRounded,
  Cursor01Icon,
  FingerPrintCheckIcon,
  Loading03Icon,
  StructureIcon,
} from "@hugeicons-pro/core-duotone-rounded";
import { Badge } from "../badge";
import { Container } from "../container";
import { SectionHeading } from "../seciton-heading";
import { SubHeading } from "../subheading";
import { Card, CardDescription, CardTitle } from "./card";
import {
  LLMModelSelectorSkeleton,
  NativeToolsIntegrationSkeleton,
  TextToWorkflowBuilderSkeleton,
} from "./skeletons";

export const AgenticIntelligence = () => (
  <Container className="border-divide border-x">
    <div className="flex flex-col items-center py-16">
      <Badge text="Features" />
      <SectionHeading className="mt-4">
        Everything you need to close the feedback loop
      </SectionHeading>

      <SubHeading as="p" className="mx-auto mt-6 max-w-lg px-2">
        Collect feedback, let users vote, share your roadmap, and keep everyone
        informed—all with zero friction for your customers.
      </SubHeading>
      <div className="mt-16 grid grid-cols-1 divide-y divide-divide border-divide border-y md:grid-cols-2 md:divide-x">
        <Card className="mask-b-from-80% overflow-hidden">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              color="currentColor"
              icon={CodeCircleDuotoneRounded}
              size={24}
              strokeWidth={1.5}
            />
            <CardTitle>Native SDKs for Every Platform</CardTitle>
          </div>
          <CardDescription>
            First-class support for React, React Native, Swift, Next.js, and
            Vue. Works with your tech stack, not against it. Consistent API
            across all platforms.
          </CardDescription>
          <LLMModelSelectorSkeleton />
        </Card>
        <Card className="mask-b-from-80% overflow-hidden">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              color="currentColor"
              icon={Loading03Icon}
              size={24}
              strokeWidth={1.5}
            />
            <CardTitle>Lightweight & Fast</CardTitle>
          </div>
          <CardDescription>
            Sub-10KB bundle size. Zero impact on your app's performance.
            Lazy-loaded by default. Works offline with local caching.
          </CardDescription>
          <TextToWorkflowBuilderSkeleton />
        </Card>
      </div>
      <div className="w-full">
        <Card className="relative w-full max-w-none overflow-hidden">
          <div className="mask-radial-from-10% pointer-events-none absolute inset-0 h-full w-full bg-[radial-gradient(var(--color-dots)_1px,transparent_1px)] [background-size:10px_10px]" />
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              color="currentColor"
              icon={Cursor01Icon}
              size={24}
              strokeWidth={1.5}
            />
            <CardTitle>Framework-Agnostic Widget</CardTitle>
          </div>
          <CardDescription>
            Drop in our feedback widget with one line of code. Customizable UI
            that matches your brand. Works in web, mobile, and native apps.
          </CardDescription>
          <NativeToolsIntegrationSkeleton />
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        <Card>
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              color="currentColor"
              icon={AiBeautifyIcon}
              size={24}
              strokeWidth={1.5}
            />
            <CardTitle>Developer-Friendly Docs</CardTitle>
          </div>
          <CardDescription>
            Clear guides for every framework. Quick-start examples, API
            references, and troubleshooting tips. Built by developers, for
            developers.
          </CardDescription>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              color="currentColor"
              icon={FingerPrintCheckIcon}
              size={24}
              strokeWidth={1.5}
            />
            <CardTitle>Unified Feedback Dashboard</CardTitle>
          </div>
          <CardDescription>
            Feedback from all platforms (web, iOS, Android) in one place. See
            votes, organize by tags, track trends across your entire product.
          </CardDescription>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              color="currentColor"
              icon={StructureIcon}
              size={24}
              strokeWidth={1.5}
            />
            <CardTitle>Public Roadmap & Changelog</CardTitle>
          </div>
          <CardDescription>
            Share your roadmap with users. Announce shipped features with
            changelogs. Keep everyone aligned on what's next.
          </CardDescription>
        </Card>
      </div>
    </div>
  </Container>
);
