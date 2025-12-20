"use client";

import type { Organization } from "@userbubble/db/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@userbubble/ui/tabs";
import { useState } from "react";
import { BrandingTab } from "./tabs/branding-tab";
import { ChangelogTab } from "./tabs/changelog-tab";
import { DataTab } from "./tabs/data-tab";
// import { DomainTab } from "./tabs/domain-tab";
import { FeedbackTab } from "./tabs/feedback-tab";

type SettingsTabsProps = {
  organization: Organization;
  userRole: "owner" | "admin" | "member";
};

export function SettingsTabs({ organization, userRole }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState("branding");

  return (
    <Tabs onValueChange={setActiveTab} value={activeTab}>
      <TabsList className="mb-6" variant="line">
        <TabsTrigger value="branding">Branding</TabsTrigger>
        <TabsTrigger value="feedback">Feedback</TabsTrigger>
        <TabsTrigger value="changelog">Changelog</TabsTrigger>
        {/* <TabsTrigger value="billing">Billing</TabsTrigger> */}
        {/* <TabsTrigger value="domain">Domain</TabsTrigger> */}
        {/* <TabsTrigger value="integrations">Integrations</TabsTrigger> */}
        {/* <TabsTrigger value="sso">SSO</TabsTrigger> */}
        <TabsTrigger value="data">Data</TabsTrigger>
      </TabsList>

      <TabsContent value="branding">
        <BrandingTab organization={organization} />
      </TabsContent>

      <TabsContent value="feedback">
        <FeedbackTab organization={organization} />
      </TabsContent>

      <TabsContent value="changelog">
        <ChangelogTab organization={organization} />
      </TabsContent>

      {/* <TabsContent value="billing">
        <PlaceholderTab
          description="Manage your subscription and billing settings."
          title="Billing"
        />
      </TabsContent> */}

      {/* <TabsContent value="domain">
        <DomainTab organization={organization} />
      </TabsContent> */}

      {/* <TabsContent value="integrations">
        <PlaceholderTab
          description="Connect third-party services and tools."
          title="Integrations"
        />
      </TabsContent> */}

      {/* <TabsContent value="sso">
        <PlaceholderTab
          description="Configure single sign-on for your organization."
          title="SSO"
        />
      </TabsContent> */}

      <TabsContent value="data">
        <DataTab organization={organization} userRole={userRole} />
      </TabsContent>
    </Tabs>
  );
}

function _PlaceholderTab({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border p-8 text-center">
      <h3 className="mb-2 font-semibold text-lg">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
