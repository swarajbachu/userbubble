"use client";

import {
  DoubleCard,
  DoubleCardFooter,
  DoubleCardInner,
} from "@userbubble/ui/double-card";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SignInForm } from "~/components/auth/sign-in-form";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  return (
    <div className="flex items-center justify-center">
      <DoubleCard className="w-full max-w-md">
        <DoubleCardInner>
          <SignInForm
            callbackUrl={callbackUrl}
            onSuccess={() => router.push(callbackUrl)}
          />
        </DoubleCardInner>
        <DoubleCardFooter className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link className="underline underline-offset-4" href="/sign-up">
            Sign up
          </Link>
        </DoubleCardFooter>
      </DoubleCard>
    </div>
  );
}
