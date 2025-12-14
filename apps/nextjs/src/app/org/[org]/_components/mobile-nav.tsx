"use client";

import { Button } from "@critichut/ui/button";
import { Icon } from "@critichut/ui/icon";
import { Sheet, SheetContent, SheetTrigger } from "@critichut/ui/sheet";
import { SidebarProvider } from "@critichut/ui/sidebar";
import { Menu01Icon } from "@hugeicons-pro/core-bulk-rounded";
import { OrgSidebar } from "./org-sidebar";

type MobileNavProps = {
  org: string;
  organizationName: string;
};

export function MobileNav({ org, organizationName }: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger>
        <Button className="fixed top-4 left-4 z-40" size="icon" variant="ghost">
          <Icon icon={Menu01Icon} size={24} />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[280px] p-0" side="left">
        <SidebarProvider>
          <OrgSidebar org={org} organizationName={organizationName} />
        </SidebarProvider>
      </SheetContent>
    </Sheet>
  );
}
