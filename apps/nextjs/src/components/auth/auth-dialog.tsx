"use client";

import { Dialog, DialogContent } from "@userbubble/ui/dialog";
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
      <DialogContent className="sm:max-w-[425px]">
        {mode === "signin" ? (
          <SignInForm
            onSuccess={handleSuccess}
            onSwitchToSignUp={() => setMode("signup")}
            showSwitchToSignUp
          />
        ) : (
          <SignUpForm
            onSuccess={handleSuccess}
            onSwitchToSignIn={() => setMode("signin")}
            showSwitchToSignIn
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
