# Ultracite Code Standards

This project uses **Ultracite**, a zero-config Biome preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `npx ultracite fix`
- **Check for issues**: `npx ultracite check`
- **Diagnose setup**: `npx ultracite doctor`

Biome (the underlying engine) provides extremely fast Rust-based linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**
- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**
- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**
- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

## Project-Specific Patterns

### Import Paths

**Always use package-level exports, not deep imports:**

```typescript
// ✅ Correct - use package exports
import { generateSecretKey, verifyHMAC } from "@critichut/auth";
import { organizationQueries, memberQueries } from "@critichut/db/queries";
import { createOrganizationValidator } from "@critichut/db/schema";
import { createSlug, isValidSlug, isReservedSlug } from "@critichut/db/lib/slug";

// ❌ Wrong - don't use deep imports
import { generateSecretKey } from "@critichut/auth/utils/hmac";
import { createOrganizationValidator } from "@critichut/db/validators";
import { organizationQueries } from "@critichut/db/queries/organization";
```

**Frontend imports:**
```typescript
// Auth client (Better Auth React)
import { authClient } from "~/auth/client";

// Server-side auth
import { auth } from "~/auth/server";

// tRPC - use for custom endpoints not covered by Better Auth
import { useTRPC } from "~/trpc/react";
```

### Better Auth Usage

**Better Auth provides built-in organization management - use it directly instead of creating custom endpoints:**

**Frontend - Use authClient directly:**
```typescript
import { authClient } from "~/auth/client";

// Create organization (NO custom tRPC endpoint needed)
const { data, error } = await authClient.organization.create({
  name: "Acme Inc",
  slug: "acme-inc",
});

// List organizations
const { data: orgs } = await authClient.organization.list();

// Update organization
await authClient.organization.update({
  organizationId: "org_123",
  data: { name: "New Name" },
});

// Delete organization
await authClient.organization.delete({
  organizationId: "org_123",
});

// Invite member
await authClient.organization.inviteMember({
  email: "user@example.com",
  role: "member",
});

// Check if slug is available (NO custom tRPC endpoint needed)
const { data, error } = await authClient.organization.checkSlug({
  slug: "my-org",
});
// data.available is true if slug is available
```

**Backend - Use Better Auth server API:**
```typescript
import { auth } from "~/auth/server";

// Get session
const session = await auth.api.getSession({ headers });

// All organization methods available server-side too
const org = await auth.api.organization.create({ ... });

// Check slug availability server-side
const data = await auth.api.checkOrganizationSlug({
  body: { slug: "my-org" },
});
```

**When to use direct DB queries:**
```typescript
import { organizationQueries } from "@critichut/db/queries";

// ✅ Middleware - direct queries for performance
const userOrgs = await organizationQueries.listUserOrganizations(userId);

// ✅ Server Components - direct queries for data fetching
const org = await organizationQueries.findBySlug(slug);

// ❌ Client Components - use authClient instead
// Don't create tRPC endpoints that duplicate Better Auth functionality
```

**Adding custom fields to Better Auth organization:**

Better Auth supports adding custom fields via the organization plugin configuration:

```typescript
// packages/auth/src/index.ts
import { organization } from "better-auth/plugins";

organization({
  allowUserToCreateOrganization: true,
  creatorRole: "owner",
  schema: {
    organization: {
      additionalFields: {
        website: {
          type: "string",
          input: true,  // Allow user input
          required: false,
        },
        customField: {
          type: "string",
          input: true,
          required: false,
        },
      },
    },
  },
})
```

Once configured, use custom fields directly in authClient calls:

```typescript
const { data, error } = await authClient.organization.create({
  name: "Acme Inc",
  slug: "acme-inc",
  website: "https://acme.com",  // Custom field
});
```

**When to use tRPC (ONLY for custom functionality):**

```typescript
import { useTRPC } from "~/trpc/react";
import { useMutation } from "@tanstack/react-query";

// ❌ DON'T create tRPC endpoints for things Better Auth provides:
// - Organization creation/update/delete
// - Slug checking
// - Member management
// - Listing organizations

// ✅ DO use tRPC for custom functionality Better Auth doesn't support:
// - Complex business logic
// - Multi-step operations
// - Custom queries that don't fit Better Auth patterns
```

### Icons

**Use Huge Icons for all icon needs:**

```typescript
// ✅ Use Huge Icons
import { HugeiconsIcon } from '@hugeicons/react'
import { SearchIcon } from '@hugeicons-pro/core-duotone-rounded'
 
function App() {
  return <HugeiconsIcon icon={SearchIcon} size={24} color="currentColor" strokeWidth={1.5} />
}

The @hugeicons/react package provides a universal HugeiconsIcon component that can render any icon from our libraries.
Think of it as a smart wrapper: you pass it an icon object, and it handles sizing, color, stroke width, and even switching between two icons for different states.

Props
Prop	Type	Default	Description
icon	IconSvgObject	Required	The main icon component imported from an icon package
altIcon	IconSvgObject	-	Alternative icon component for states, interactions, or animations
showAlt	boolean	false	When true, displays the altIcon instead of the main icon
size	number	24	Icon size in pixels
color	string	currentColor	Icon color (CSS color value)
strokeWidth	number	1.5	Width of the icon strokes (works with stroke-style icons)
className	string	-	Additional CSS classes
State-based icons with altIcon and showAlt
Use altIcon and showAlt to swap between two icons based on component state:

import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { SunIcon, Moon02Icon } from '@hugeicons-pro/core-duotone-rounded'
 
function ThemeToggle() {
    const [isDark, setIsDark] = useState(false)
 
    return (
        <button onClick={() => setIsDark(!isDark)}>
            <HugeiconsIcon icon={SunIcon} altIcon={Moon02Icon} showAlt={isDark} />
        </button>
    )
}

Styling icons
You can style icons in a few ways:

size: controls the rendered icon size in pixels.
color: accepts any valid CSS color (e.g. #111827, rgb(0,0,0), currentColor).
strokeWidth: adjusts the thickness of stroke-based icons.
className: attach utility classes from Tailwind, CSS Modules, etc.
<HugeiconsIcon
  icon={Notification03Icon}
  size={32}
  color="#6366f1"
  strokeWidth={1.75}
  className="inline-block align-middle"
/>

When using currentColor, the icon inherits the text color from its parent, which works well inside buttons, links, and headings.


// ❌ Don't use lucide-react or other icon libraries
import { Building, User, Settings } from "lucide-react";
```

### Avoid Unnecessary Abstractions

- **Don't create tRPC endpoints** that just wrap Better Auth functions
- **Don't create custom validators** if Better Auth already validates
- **Use slug utilities** for client-side generation, but let Better Auth handle persistence
- **Keep it simple** - if Better Auth provides it, use it directly

---

Most formatting and common issues are automatically fixed by Biome. Run `npx ultracite fix` before committing to ensure compliance.
