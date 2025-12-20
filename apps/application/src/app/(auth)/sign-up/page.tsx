"use client";

import {
  DoubleCard,
  DoubleCardFooter,
  DoubleCardInner,
} from "@userbubble/ui/double-card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignUpForm } from "~/components/auth/sign-up-form";

export default function SignUpPage() {
  const router = useRouter();
  const callbackUrl = "/complete";

  return (
    <div className="flex items-center justify-center">
      <DoubleCard className="w-full max-w-md">
        <DoubleCardInner>
          <SignUpForm
            callbackUrl={callbackUrl}
            onSuccess={() => router.push(callbackUrl)}
          />
        </DoubleCardInner>
        <DoubleCardFooter className="text-center text-sm">
          Already have an account?{" "}
          <Link className="underline underline-offset-4" href="/sign-in">
            Sign in
          </Link>
        </DoubleCardFooter>
      </DoubleCard>
    </div>
  );
}
