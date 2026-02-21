"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  Copy01Icon,
  Delete02Icon,
  Key01Icon,
  PlusSignIcon,
} from "@hugeicons-pro/core-duotone-rounded";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Organization } from "@userbubble/db/schema";
import { Badge } from "@userbubble/ui/badge";
import { Button } from "@userbubble/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@userbubble/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@userbubble/ui/field";
import { Input } from "@userbubble/ui/input";
import { Textarea } from "@userbubble/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

export function ApiKeysTab({
  organization,
  userRole,
}: {
  organization: Organization;
  userRole: "owner" | "admin" | "member";
}) {
  const trpc = useTRPC();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<{
    apiKey: {
      id: string;
      name: string;
      keyPreview: string;
      createdAt: Date;
      updatedAt: Date;
      organizationId: string;
      description: string | null;
      keyHash: string;
      isActive: boolean;
      expiresAt: Date | null;
      lastUsedAt: Date | null;
    };
    rawKey: string;
  } | null>(null);

  // Fetch API keys
  const { data: apiKeys, refetch } = useQuery(
    trpc.apiKey.list.queryOptions({
      organizationId: organization.id,
    })
  );

  // Create mutation
  const createKey = useMutation(
    trpc.apiKey.create.mutationOptions({
      onSuccess: (data) => {
        if (data.apiKey) {
          setCreatedKey(data as typeof createdKey);
          setCreateDialogOpen(false);
          setSuccessDialogOpen(true);
          void refetch();
        }
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create API key");
      },
    })
  );

  // Toggle active mutation
  const toggleActive = useMutation(
    trpc.apiKey.toggleActive.mutationOptions({
      onSuccess: () => {
        toast.success("API key updated successfully");
        void refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update API key");
      },
    })
  );

  // Delete mutation
  const deleteKey = useMutation(
    trpc.apiKey.delete.mutationOptions({
      onSuccess: () => {
        toast.success("API key deleted successfully");
        void refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete API key");
      },
    })
  );

  const canManage = userRole === "owner" || userRole === "admin";
  const activeCount = apiKeys?.filter((k) => k.isActive).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">API Keys</h3>
          <p className="text-muted-foreground text-sm">
            Manage API keys for mobile SDK authentication
          </p>
          {apiKeys && (
            <p className="mt-1 text-muted-foreground text-xs">
              {activeCount} / 10 active keys
            </p>
          )}
        </div>
        {canManage && (
          <Button
            disabled={activeCount >= 10}
            onClick={() => setCreateDialogOpen(true)}
          >
            <HugeiconsIcon
              className="mr-2 h-4 w-4"
              icon={PlusSignIcon}
              size={16}
            />
            Create API Key
          </Button>
        )}
      </div>

      {!apiKeys || apiKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <HugeiconsIcon
            className="mb-4 h-12 w-12 text-muted-foreground"
            icon={Key01Icon}
            size={48}
          />
          <h3 className="mb-2 font-semibold text-lg">No API keys yet</h3>
          <p className="mb-4 max-w-sm text-muted-foreground text-sm">
            Create your first API key to authenticate your mobile SDK
          </p>
          {canManage && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <HugeiconsIcon
                className="mr-2 h-4 w-4"
                icon={PlusSignIcon}
                size={16}
              />
              Create API Key
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key) => (
            <div
              className="flex items-center justify-between rounded-lg border p-4"
              key={key.id}
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{key.name}</p>
                  <Badge variant={key.isActive ? "success" : "secondary"}>
                    {key.isActive ? "Active" : "Revoked"}
                  </Badge>
                </div>
                {key.description && (
                  <p className="text-muted-foreground text-sm">
                    {key.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-muted-foreground text-xs">
                  <span>Key: {key.keyPreview}</span>
                  {key.lastUsedAt && (
                    <span>
                      Last used{" "}
                      {formatDistanceToNow(new Date(key.lastUsedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                  <span>
                    Created{" "}
                    {formatDistanceToNow(new Date(key.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {key.expiresAt && (
                    <span className="text-destructive">
                      Expires{" "}
                      {formatDistanceToNow(new Date(key.expiresAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>
              </div>

              {canManage && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() =>
                      toggleActive.mutate({
                        id: key.id,
                        isActive: !key.isActive,
                      })
                    }
                    size="sm"
                    variant="outline"
                  >
                    {key.isActive ? "Revoke" : "Restore"}
                  </Button>
                  <Button
                    onClick={() => {
                      if (
                        // biome-ignore lint/suspicious/noAlert: User confirmation required for destructive action
                        window.confirm(
                          `Are you sure you want to delete "${key.name}"? This action cannot be undone.`
                        )
                      ) {
                        deleteKey.mutate({ id: key.id });
                      }
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    <HugeiconsIcon
                      className="h-4 w-4 text-destructive"
                      icon={Delete02Icon}
                      size={16}
                    />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateApiKeyDialog
        isLoading={createKey.isPending}
        onOpenChange={setCreateDialogOpen}
        onSubmit={(data) => {
          createKey.mutate({
            organizationId: organization.id,
            ...data,
          });
        }}
        open={createDialogOpen}
      />

      {/* Success Dialog */}
      {createdKey && (
        <SuccessDialog
          apiKey={createdKey}
          onOpenChange={(open) => {
            setSuccessDialogOpen(open);
            if (!open) {
              setCreatedKey(null);
            }
          }}
          open={successDialogOpen}
        />
      )}
    </div>
  );
}

function CreateApiKeyDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description?: string }) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  // Reset form when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!(isOpen || isLoading)) {
      setName("");
      setDescription("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>
            Create a new API key for mobile SDK authentication
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="space-y-4">
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input
              disabled={isLoading}
              onChange={(e) => setName(e.target.value)}
              placeholder="Production iOS App"
              value={name}
            />
            <FieldDescription>
              A descriptive name to identify this key
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Description (optional)</FieldLabel>
            <Textarea
              disabled={isLoading}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Used for production iOS app authentication"
              rows={3}
              value={description}
            />
            <FieldDescription>
              Additional details about this key&apos;s purpose
            </FieldDescription>
          </Field>
        </DialogPanel>

        <DialogFooter>
          <Button
            disabled={isLoading}
            onClick={() => handleOpenChange(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? "Creating..." : "Create Key"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

function SuccessDialog({
  apiKey,
  open,
  onOpenChange,
}: {
  apiKey: {
    apiKey: { id: string; name: string; keyPreview: string };
    rawKey: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(apiKey.rawKey);
    setCopied(true);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>API Key Created Successfully</DialogTitle>
          <DialogDescription>
            Save this key now. You won&apos;t be able to see it again!
          </DialogDescription>
        </DialogHeader>

        <DialogPanel className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-sm">{apiKey.apiKey.name}</span>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex items-center gap-2">
              <code className="block flex-1 overflow-x-auto rounded bg-background p-2 font-mono text-xs">
                {apiKey.rawKey}
              </code>
              <Button
                className="shrink-0"
                onClick={copyToClipboard}
                size="sm"
                variant="outline"
              >
                {copied ? (
                  <>
                    <HugeiconsIcon
                      className="mr-2 h-4 w-4"
                      icon={CheckmarkCircle01Icon}
                      size={16}
                    />
                    Copied
                  </>
                ) : (
                  <>
                    <HugeiconsIcon
                      className="mr-2 h-4 w-4"
                      icon={Copy01Icon}
                      size={16}
                    />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
            <p className="font-medium text-amber-900 text-sm dark:text-amber-100">
              Important: Save this key securely
            </p>
            <p className="mt-1 text-amber-800 text-xs dark:text-amber-200">
              This is the only time you&apos;ll see the full key. Store it in a
              secure location like a password manager or environment variables.
            </p>
          </div>
        </DialogPanel>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
