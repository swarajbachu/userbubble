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
        Everything you need for user feedback
      </SectionHeading>

      <SubHeading as="p" className="mx-auto mt-6 max-w-lg px-2">
        Collect feedback from your users, prioritize with votes, and ship
        features faster—all without leaving your existing workflow.
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
            <CardTitle>Universal SDKs</CardTitle>
          </div>
          <CardDescription>
            SDKs for every platform. React, Next.js, Remix, React Native, and
            more. Native Swift and Kotlin SDKs coming soon.
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
            Sub-10KB bundle size won't slow down your app. Lazy-loaded by
            default. Works offline with local storage—syncs when connected.
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
            <CardTitle>Native Experience</CardTitle>
          </div>
          <CardDescription>
            Feedback widget that feels native to every platform. Follows design
            guidelines. Supports dark mode and accessibility features out of the
            box.
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
