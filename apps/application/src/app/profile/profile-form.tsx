"use client";

import { useMutation } from "@tanstack/react-query";
import type { RouterOutputs } from "@userbubble/api";
import { Button } from "@userbubble/ui/button";
import {
  Card,
  CardContent,
  CardFrame,
  CardFrameFooter,
  CardHeader,
} from "@userbubble/ui/card";
import { Input } from "@userbubble/ui/input";
import { Label } from "@userbubble/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";

export function ProfileForm({
  profile,
}: {
  profile: RouterOutputs["account"]["getProfile"];
}) {
  const trpc = useTRPC();
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [image, setImage] = useState(profile.image ?? "");
  const update = useMutation(
    trpc.account.updateProfile.mutationOptions({
      onSuccess: () => router.refresh(),
    })
  );
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <Link
        className="inline-flex h-8 items-center rounded-md text-muted-foreground text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        href="/"
      >
        Back to workspace
      </Link>
      <form
        className="mt-5"
        onSubmit={(event) => {
          event.preventDefault();
          update.mutate({ name, image: image.trim() || null });
        }}
      >
        <CardFrame>
          <Card>
            <CardHeader>
              <h1 className="font-semibold text-xl">Your profile</h1>
              <p className="text-muted-foreground text-sm">
                Your name and image appear across your workspaces.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  autoComplete="name"
                  disabled={update.isPending}
                  id="profile-name"
                  maxLength={100}
                  onChange={(event) => {
                    setName(event.target.value);
                    update.reset();
                  }}
                  required
                  value={name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-image">Profile image URL</Label>
                <div className="flex gap-2">
                  <Input
                    aria-describedby="profile-image-help"
                    disabled={update.isPending}
                    id="profile-image"
                    onChange={(event) => {
                      setImage(event.target.value);
                      update.reset();
                    }}
                    placeholder="https://…"
                    type="url"
                    value={image}
                  />
                  <Button
                    disabled={!image || update.isPending}
                    onClick={() => {
                      setImage("");
                      update.reset();
                    }}
                    type="button"
                    variant="outline"
                  >
                    Clear
                  </Button>
                </div>
                <p
                  className="text-muted-foreground text-xs"
                  id="profile-image-help"
                >
                  Use an HTTP or HTTPS image URL, or leave this blank.
                </p>
              </div>
              {update.isError && (
                <p className="text-destructive text-sm" role="alert">
                  {update.error.message}
                </p>
              )}
            </CardContent>
          </Card>
          <CardFrameFooter className="flex items-center gap-3">
            <Button disabled={update.isPending || !name.trim()} type="submit">
              {update.isPending ? "Saving…" : "Save profile"}
            </Button>
            <p aria-live="polite" className="text-muted-foreground text-sm">
              {update.isSuccess ? "Profile saved." : ""}
            </p>
          </CardFrameFooter>
        </CardFrame>
      </form>
    </main>
  );
}
