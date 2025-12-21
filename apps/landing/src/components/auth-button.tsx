"use client";

import { Button } from "@userbubble/ui/button";
import Link from "next/link";
import { authClient } from "~/auth/client";

const APP_URL = "https://app.userbubble.com";

export const AuthButton = ({ className }: { className?: string }) => {
  const session = authClient.useSession();

  if (session.data) {
    return (
      <Button
        className={className}
        render={<Link href={`${APP_URL}/dashboard`} />}
      >
        Dashboard
      </Button>
    );
  }

  return (
    <Button
      className={className}
      render={<Link href={`${APP_URL}/api/auth/signin`} />}
    >
      Get Started Now
    </Button>
  );
};
