"use client";

import { Button } from "@critichut/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSeparator,
} from "@critichut/ui/field";
import { Input } from "@critichut/ui/input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { authClient } from "~/auth/client";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        setError(result.error.message ?? "Failed to create account");
        return;
      }

      router.push(callbackUrl);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setError(null);
    setIsLoading(true);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      });
    } catch {
      setError("Failed to sign up with Google");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-semibold text-3xl tracking-tight">
            Create an account
          </h1>
          <p className="text-muted-foreground text-sm">
            Get started with Critichut today
          </p>
        </div>

        <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
          <Button
            className="w-full"
            disabled={isLoading}
            onClick={handleGoogleSignUp}
            type="button"
            variant="outline"
          >
            <svg
              aria-label="Google logo"
              className="mr-2 size-4"
              role="img"
              viewBox="0 0 24 24"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <FieldSeparator>or</FieldSeparator>

          <form className="space-y-4" onSubmit={handleEmailSignUp}>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                autoComplete="name"
                disabled={isLoading}
                id="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                type="text"
                value={name}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                autoComplete="email"
                disabled={isLoading}
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                autoComplete="new-password"
                disabled={isLoading}
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                type="password"
                value={password}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Input
                autoComplete="new-password"
                disabled={isLoading}
                id="confirm-password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                type="password"
                value={confirmPassword}
              />
            </Field>

            {error && <FieldError>{error}</FieldError>}

            <Button className="w-full" disabled={isLoading} type="submit">
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <FieldDescription className="text-center">
            Already have an account?{" "}
            <Link
              className="font-medium text-primary hover:underline"
              href="/sign-in"
            >
              Sign in
            </Link>
          </FieldDescription>
        </div>
      </div>
    </div>
  );
}
