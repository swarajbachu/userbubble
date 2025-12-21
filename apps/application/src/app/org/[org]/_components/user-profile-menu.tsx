"use client";

import { Logout01Icon, UserIcon } from "@hugeicons-pro/core-bulk-rounded";
import { Avatar, AvatarFallback, AvatarImage } from "@userbubble/ui/avatar";
import { Button } from "@userbubble/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@userbubble/ui/dropdown-menu";
import { Icon } from "@userbubble/ui/icon";
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
          <Button
            className="h-auto w-full justify-start gap-3 px-3 py-2"
            variant="ghost"
          >
            <Avatar size="sm">
              {user.image && <AvatarImage alt={user.name} src={user.image} />}
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col items-end justify-start">
              <span className="w-full truncate text-left font-medium text-sm">
                {user.name}
              </span>
            </div>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <Icon icon={UserIcon} size={16} />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} variant="destructive">
          <Icon icon={Logout01Icon} size={16} />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
