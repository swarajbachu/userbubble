"use client";

import { Menu01Icon } from "@hugeicons-pro/core-bulk-rounded";
import { Button } from "@userbubble/ui/button";
import { Icon } from "@userbubble/ui/icon";
import { Sheet, SheetContent, SheetTrigger } from "@userbubble/ui/sheet";
import { SidebarProvider } from "@userbubble/ui/sidebar";
import { OrgSidebar } from "./org-sidebar";

type MobileNavProps = {
  org: string;
};

export function MobileNav({ org }: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger>
        <Button className="fixed top-4 left-4 z-40" size="icon" variant="ghost">
          <Icon icon={Menu01Icon} size={24} />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[280px] p-0" side="left">
        <SidebarProvider>
          <OrgSidebar org={org} />
        </SidebarProvider>
      </SheetContent>
    </Sheet>
  );
}
