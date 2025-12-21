"use client";

import {
  Mail02Icon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons-pro/core-bulk-rounded";
import { Button } from "@userbubble/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@userbubble/ui/card";
import { Icon } from "@userbubble/ui/icon";
import { Input } from "@userbubble/ui/input";
import { Label } from "@userbubble/ui/label";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "~/auth/client";

type SignUpFormProps = {
  onSuccess?: () => void;
  callbackUrl?: string;
  showSwitchToSignIn?: boolean;
  onSwitchToSignIn?: () => void;
};

export function SignUpForm({
  onSuccess,
  callbackUrl = "/complete",
  showSwitchToSignIn,
  onSwitchToSignIn,
}: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => setIsVisible((prev) => !prev);

  async function handleEmailSignUp(e: FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name: "User",
      });

      if (result.error) {
        toast.error(result.error.message ?? "Failed to create account");
        return;
      }

      onSuccess?.();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setIsLoading(true);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      });
    } catch {
      toast.error("Failed to sign up with Google");
      setIsLoading(false);
    }
  }

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Create an account</CardTitle>
        <CardDescription>
          Enter your email below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <form onSubmit={handleEmailSignUp}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  autoComplete="email"
                  className="peer pe-9"
                  disabled={isLoading}
                  id="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="m@example.com"
                  required
                  type="email"
                  value={email}
                />
                <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
                  <Icon icon={Mail02Icon} />
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  autoComplete="new-password"
                  className="pe-9"
                  disabled={isLoading}
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  type={isVisible ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-controls="password"
                  aria-label={isVisible ? "Hide password" : "Show password"}
                  aria-pressed={isVisible}
                  className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 outline-none transition-[color,box-shadow] hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={toggleVisibility}
                  type="button"
                >
                  {isVisible ? (
                    <Icon icon={ViewOffIcon} />
                  ) : (
                    <Icon icon={ViewIcon} />
                  )}
                </button>
              </div>
            </div>
            <Button className="w-full" disabled={isLoading} type="submit">
              {isLoading ? "Creating account..." : "Sign up"}
            </Button>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

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

        {showSwitchToSignIn && (
          <p className="text-center text-sm">
            Already have an account?{" "}
            <button
              className="underline underline-offset-4 hover:text-primary"
              onClick={onSwitchToSignIn}
              type="button"
            >
              Sign in
            </button>
          </p>
        )}
      </CardContent>
    </>
  );
}
