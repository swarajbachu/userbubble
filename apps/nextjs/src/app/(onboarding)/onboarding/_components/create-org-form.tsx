"use client";

import { createSlug } from "@critichut/db/schema";
import { Button } from "@critichut/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@critichut/ui/field";
import { Input } from "@critichut/ui/input";
import { toast } from "@critichut/ui/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "~/auth/client";

export function CreateOrgForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Auto-generate slug from name (only if not manually edited)
  const handleNameChange = (value: string) => {
    setName(value);

    if (!isSlugManuallyEdited && value.length > 0) {
      const generatedSlug = createSlug(value);
      setSlug(generatedSlug);
    }
  };

  // Handle manual slug editing
  const handleSlugChange = (value: string) => {
    setIsSlugManuallyEdited(true);
    const cleanedSlug = createSlug(value);
    setSlug(cleanedSlug);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(name && slug)) {
      toast.error("Please fill in all fields");
      return;
    }

    if (slug.length < 3 || slug.length > 50) {
      toast.error("Slug must be between 3 and 50 characters");
      return;
    }

    setIsCreating(true);

    try {
      // Use Better Auth directly!
      const { data, error } = await authClient.organization.create({
        name,
        slug,
      });

      if (error) {
        toast.error(error.message ?? "Failed to create organization");
        return;
      }

      toast.success("Organization created successfully!");
      router.push(`/${data.slug}/feedback`);
    } catch {
      toast.error("Failed to create organization");
    } finally {
      setIsCreating(false);
    }
  };

  const canSubmit = name.length >= 3 && slug.length >= 3 && !isCreating;

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* Organization Name Field */}
      <Field>
        <FieldContent>
          <FieldLabel htmlFor="name">Organization Name</FieldLabel>
          <FieldDescription>
            The display name for your organization
          </FieldDescription>
        </FieldContent>
        <Input
          autoComplete="organization"
          id="name"
          maxLength={100}
          minLength={3}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Acme Inc"
          required
          type="text"
          value={name}
        />
      </Field>

      {/* Organization Slug Field */}
      <Field>
        <FieldContent>
          <FieldLabel htmlFor="slug">Organization Slug</FieldLabel>
          <FieldDescription>
            Used in your organization&apos;s URL: critichut.com/
            {slug || "your-slug"}
          </FieldDescription>
        </FieldContent>
        <Input
          autoComplete="off"
          id="slug"
          maxLength={50}
          minLength={3}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="acme-inc"
          required
          type="text"
          value={slug}
        />
      </Field>

      {/* Submit Button */}
      <Button className="w-full" disabled={!canSubmit} type="submit">
        {isCreating ? "Creating..." : "Create Organization"}
      </Button>
    </form>
  );
}
