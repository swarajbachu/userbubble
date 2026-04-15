"use client";

import {
  Logout01Icon,
  MoreVerticalCircle01Icon,
  UserIcon,
} from "@hugeicons-pro/core-bulk-rounded";
import { Avatar, AvatarFallback, AvatarImage } from "@userbubble/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@userbubble/ui/dropdown-menu";
import { Icon } from "@userbubble/ui/icon";
import { SidebarMenuButton, useSidebar } from "@userbubble/ui/sidebar";
import { useRouter } from "next/navigation";
import { authClient } from "~/auth/client";

type User = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

type UserProfileMenuProps = {
  user: User;
};

export function UserProfileMenu({ user }: UserProfileMenuProps) {
  const router = useRouter();
  const { isMobile } = useSidebar();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            size="lg"
          >
            <Avatar className="h-8 w-8 rounded-lg">
              {user.image && <AvatarImage alt={user.name} src={user.image} />}
              <AvatarFallback className="rounded-lg">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user.name}</span>
              <span className="truncate text-muted-foreground text-xs">
                {user.email}
              </span>
            </div>
            <Icon
              className="ml-auto text-muted-foreground"
              icon={MoreVerticalCircle01Icon}
            />
          </SidebarMenuButton>
        }
      />
      <DropdownMenuContent
        align="end"
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        side={isMobile ? "bottom" : "right"}
        sideOffset={4}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg">
                {user.image && <AvatarImage alt={user.name} src={user.image} />}
                <AvatarFallback className="rounded-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-muted-foreground text-xs">
                  {user.email}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/profile")}>
            <Icon icon={UserIcon} size={16} />
            <span>Account</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} variant="destructive">
          <Icon icon={Logout01Icon} size={16} />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
