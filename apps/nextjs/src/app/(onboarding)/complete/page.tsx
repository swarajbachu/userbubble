"use client";

import {
  Tick01Icon,
  UserAccountIcon,
  UserSquareIcon,
} from "@hugeicons-pro/core-bulk-rounded";
import { Button } from "@userbubble/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@userbubble/ui/card";
import {
  DoubleCard,
  DoubleCardFooter,
  DoubleCardInner,
} from "@userbubble/ui/double-card";
import { Icon } from "@userbubble/ui/icon";
import { Input } from "@userbubble/ui/input";
import { Label } from "@userbubble/ui/label";
import { toast } from "@userbubble/ui/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "~/auth/client";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    try {
      const { data, error } = await authClient.updateUser({
        name: fullName,
      });

      if (error) {
        toast.error(error.message ?? "Failed to update profile");
        return;
      }

      if (data) {
        toast.success("Profile updated successfully");
      }

      router.push("/");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center">
      <DoubleCard className="w-full max-w-md">
        <DoubleCardInner>
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon icon={Tick01Icon} size={24} strokeWidth={1.5} />
            </div>
            <CardTitle className="text-xl">Update your profile</CardTitle>
            <CardDescription>That's it! We're almost done.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              id="complete-profile-form"
              onSubmit={handleSubmit}
            >
              <div className="grid gap-2">
                <Label htmlFor="firstName">First name</Label>
                <div className="relative">
                  <Input
                    className="peer pe-9"
                    id="firstName"
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    required
                    value={firstName}
                  />
                  <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
                    <Icon icon={UserAccountIcon} />
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last name</Label>
                <div className="relative">
                  <Input
                    className="peer pe-9"
                    id="lastName"
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                    required
                    value={lastName}
                  />
                  <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
                    <Icon icon={UserSquareIcon} />
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </DoubleCardInner>
        <DoubleCardFooter>
          <Button
            className="w-full"
            disabled={isLoading}
            form="complete-profile-form"
            type="submit"
          >
            {isLoading ? "Updating..." : "Complete"}
          </Button>
        </DoubleCardFooter>
      </DoubleCard>
    </div>
  );
}
