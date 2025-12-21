"use client";

import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@userbubble/ui/dialog";
import { useState } from "react";
import { SignInForm } from "./sign-in-form";
import { SignUpForm } from "./sign-up-form";

type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: "signin" | "signup";
  onSuccess?: () => void;
};

export function AuthDialog({
  open,
  onOpenChange,
  defaultMode = "signin",
  onSuccess,
}: AuthDialogProps) {
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);

  const handleSuccess = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPopup className="p-0 sm:max-w-[450px]">
        <DialogHeader className="sr-only">
          <DialogTitle className="sr-only">
            {mode === "signin" ? "Sign In" : "Sign Up"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {mode === "signin"
              ? "Sign in to your account to continue"
              : "Create a new account to get started"}
          </DialogDescription>
        </DialogHeader>
        <div className="p-6">
          {mode === "signin" ? (
            <SignInForm
              callbackUrl={undefined}
              onSuccess={handleSuccess}
              onSwitchToSignUp={() => setMode("signup")}
              showSwitchToSignUp
            />
          ) : (
            <SignUpForm
              callbackUrl={undefined}
              onSuccess={handleSuccess}
              onSwitchToSignIn={() => setMode("signin")}
              showSwitchToSignIn
            />
          )}
        </div>
      </DialogPopup>
    </Dialog>
  );
}
