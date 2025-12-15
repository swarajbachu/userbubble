"use client";

import { Add01Icon, Loading03Icon } from "@hugeicons-pro/core-bulk-rounded";
import { useQuery } from "@tanstack/react-query";
import { isReservedSlug, isValidSlug } from "@userbubble/db/schema";
import { Button } from "@userbubble/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@userbubble/ui/dialog";
import { Icon } from "@userbubble/ui/icon";
import { Input } from "@userbubble/ui/input";
import { Label } from "@userbubble/ui/label";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "~/auth/client";

type CreateOrgDialogProps = {
  canCreateOrg: boolean;
  maxOrgs?: number;
};

export function CreateOrgDialog({
  canCreateOrg,
  maxOrgs,
}: CreateOrgDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [website, setWebsite] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  // Auto-generate slug from name
  useEffect(() => {
    if (name && !slug) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 40);
      setSlug(generated);
    }
  }, [name, slug]);

  // Check slug availability
  const { data: slugCheck, isLoading: isCheckingSlug } = useQuery({
    queryKey: ["checkSlug", slug],
    queryFn: async () => {
      const result = await authClient.organization.checkSlug({ slug });
      return result.data;
    },
    enabled: Boolean(
      slug && slug.length >= 3 && isValidSlug(slug) && !isReservedSlug(slug)
    ),
  });

  const handleCreate = async () => {
    if (!canCreateOrg) {
      toast.error(
        `You've reached the limit of ${maxOrgs} organizations. Upgrade your plan.`
      );
      return;
    }

    if (!(name && slug)) {
      toast.error("Organization name and slug are required");
      return;
    }

    if (!isValidSlug(slug)) {
      toast.error("Invalid slug format");
      return;
    }

    if (isReservedSlug(slug)) {
      toast.error("This slug is reserved");
      return;
    }

    if (!slugCheck?.status) {
      toast.error("Slug is not available");
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await authClient.organization.create({
        name,
        slug,
        website: website || undefined,
      });

      if (error) {
        toast.error(error.message || "Failed to create organization");
        return;
      }

      if (data) {
        toast.success("Organization created successfully!");
        setOpen(false);
        router.push(`/org/${data.slug}/feedback`);
      }
    } catch {
      toast.error("Failed to create organization");
    } finally {
      setIsCreating(false);
    }
  };

  const isSlugValid =
    slug &&
    slug.length >= 3 &&
    isValidSlug(slug) &&
    !isReservedSlug(slug) &&
    slugCheck?.status === true;

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger>
        <Button
          className="w-full justify-start gap-2"
          disabled={!canCreateOrg}
          variant="ghost"
        >
          <Icon icon={Add01Icon} size={20} />
          <span>New Organization</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogBody>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Create a new organization to manage feedback and roadmaps.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Inc."
                value={name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Subdomain</Label>
              <div className="flex">
                <Input
                  className="-me-px rounded-e-none"
                  id="slug"
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  placeholder="acme-inc"
                  value={slug}
                />
                <span className="inline-flex items-center rounded-e-md border border-input bg-input/30 px-3 text-muted-foreground text-sm">
                  .userbubble.com
                </span>
              </div>
              {isCheckingSlug && (
                <p className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Icon
                    className="animate-spin"
                    icon={Loading03Icon}
                    size={12}
                  />
                  Checking availability...
                </p>
              )}
              {!isCheckingSlug && slug.length >= 3 && !isSlugValid && (
                <p className="text-destructive text-xs">
                  Slug is unavailable or invalid
                </p>
              )}
              {!isCheckingSlug && isSlugValid && (
                <p className="text-green-600 text-xs">Subdomain is available</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website (Optional)</Label>
              <Input
                id="website"
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://acme.com"
                type="url"
                value={website}
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button
              disabled={!isSlugValid || isCreating}
              onClick={handleCreate}
            >
              {isCreating ? "Creating..." : "Create Organization"}
            </Button>
          </DialogFooter>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
