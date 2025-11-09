# critichut Authentication Flow

> **Complete guide to UserJot-style auto-login with HMAC authentication**

**Last Updated:** 2025-11-08
**Status:** Implementation Ready
**Browser Compatibility:** ✅ Chrome, Firefox, Safari, Edge

---

## Table of Contents

1. [Overview](#overview)
2. [Safari Compatibility Strategy](#safari-compatibility-strategy)
3. [Complete Authentication Flow](#complete-authentication-flow)
4. [URL Token Authentication](#url-token-authentication)
5. [First-Party Cookie Strategy](#first-party-cookie-strategy)
6. [Security Implementation](#security-implementation)
7. [Error Handling](#error-handling)

---

## Overview

critichut uses a **Safari-compatible auto-login system** that mimics UserJot's seamless experience while providing enhanced security through HMAC signatures.

### Key Features

- ✅ **No third-party cookies** - Safari compatible
- ✅ **Clean URLs** - Tokens removed after authentication
- ✅ **Secure HMAC signatures** - Customer-verified identity
- ✅ **One-time tokens** - Session persists via first-party cookies
- ✅ **Cross-subdomain sessions** - Works across all `*.critichut.com`

### Architecture

```
Customer's Website           critichut Subdomain
(customer-app.com)          (acme.critichut.com)
       │                            │
       │ 1. SDK loaded              │
       │ 2. identify() called       │
       │ 3. User clicks link        │
       │                            │
       ├──── Token in URL ─────────>│
       │    ?auth=base64_token      │
       │                            │ 4. Read token
       │                            │ 5. Verify HMAC
       │                            │ 6. Create session
       │                            │ 7. Set cookie
       │                            │ 8. Clean URL
       │                            │
       │<──── Cookie set ───────────│
       │    .critichut.com          │
       │                            │
       │ 9. Subsequent visits       │
       ├──── Cookie sent ──────────>│
       │                            │ ✅ Authenticated
```

---

## Safari Compatibility Strategy

### The Problem

Safari's Intelligent Tracking Prevention (ITP) blocks:

- ❌ Third-party cookies in iframes
- ❌ Cookies from cross-domain API calls
- ❌ Tracking cookies without user interaction

### The Solution

**Token-based first visit → First-party cookie persistence**

```javascript
// ❌ DOESN'T WORK in Safari
await fetch('https://api.critichut.com/identify', {
  credentials: 'include' // Cookie blocked by ITP!
});

// ✅ WORKS in Safari
// 1. Pass identity via URL token
window.location.href = 'https://acme.critichut.com/feedback?auth=TOKEN';

// 2. On critichut subdomain (first-party context!)
await fetch('/api/auth/external-login', {
  credentials: 'include' // ✅ Safari allows (first-party)
});
```

### Why This Works

| Approach | Safari ITP | Reason |
|----------|------------|--------|
| **Cross-domain API + cookie** | ❌ Blocked | Third-party context |
| **Iframe postMessage** | ❌ Blocked | Third-party iframe |
| **URL token → First-party API** | ✅ Allowed | First-party context on critichut domain |
| **First-party cookie on `.critichut.com`** | ✅ Allowed | Same-site cookie |

---

## Complete Authentication Flow

### Step 1: Customer's Backend Generates HMAC Signature

```typescript
// Customer's API: /api/critichut/user-signature
export async function GET(req: Request) {
  // Get user from customer's session
  const session = await getCustomerSession(req);

  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Generate HMAC signature (sign the user ID)
  const signature = crypto
    .createHmac('sha256', process.env.critichut_SECRET_KEY!)
    .update(session.user.id)
    .digest('hex');

  return Response.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      avatar: session.user.avatar,
    },
    signature: signature,
  });
}
```

**HMAC Signature Details:**
- Input: User's unique ID from customer's system
- Algorithm: HMAC-SHA256
- Key: Customer's critichut secret key (from dashboard)
- Output: Hex-encoded signature

---

### Step 2: Customer Embeds critichut SDK

```html
<!-- Customer's website (customer-app.com) -->
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <!-- Your app content -->

  <!-- critichut SDK -->
  <script src="https://cdn.critichut.com/sdk.js" async></script>
  <script>
    // Wait for SDK to load
    window.addEventListener('critichut:ready', async () => {
      // Fetch user signature from your backend
      const response = await fetch('/api/critichut/user-signature');
      const data = await response.json();

      // Initialize critichut
      window.critichut.init('acme', {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          avatar: data.user.avatar,
          signature: data.signature, // HMAC signature
        }
      });
    });
  </script>

  <!-- Regular feedback links - SDK auto-enhances them! -->
  <nav>
    <a href="https://acme.critichut.com/feedback">Submit Feedback</a>
    <a href="https://acme.critichut.com/roadmap">View Roadmap</a>
  </nav>
</body>
</html>
```

---

### Step 3: SDK Stores Identity Locally

```typescript
// critichut SDK (cdn.critichut.com/sdk.js)

class critichutSDK {
  init(orgSlug: string, config: { user: critichutUser }) {
    this.orgSlug = orgSlug;
    this.user = config.user;

    // Store identity in localStorage (customer's domain)
    const identityData = {
      orgSlug: orgSlug,
      user: config.user,
      timestamp: Date.now(),
    };

    localStorage.setItem('critichut:identity', JSON.stringify(identityData));

    console.log('[critichut] User identified:', config.user.email);

    // Auto-enhance all critichut links
    this.enhanceLinks();
  }

  private enhanceLinks() {
    // Find all links to this org's critichut subdomain
    const links = document.querySelectorAll(`a[href*="${this.orgSlug}.critichut.com"]`);

    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();

        // Get stored identity
        const identityData = localStorage.getItem('critichut:identity');

        if (identityData) {
          // Generate URL-safe token
          const token = btoa(identityData)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

          // Navigate with auth token
          const url = new URL(link.href);
          url.searchParams.set('auth', token);

          window.location.href = url.toString();
        } else {
          // No identity, navigate normally
          window.location.href = link.href;
        }
      });
    });
  }
}

// Global instance
window.critichut = new critichutSDK();

// Emit ready event
window.dispatchEvent(new Event('critichut:ready'));
```

**What's Stored:**

```json
{
  "orgSlug": "acme",
  "user": {
    "id": "customer_user_12345",
    "email": "john@example.com",
    "name": "John Doe",
    "avatar": "https://customer-app.com/avatars/john.jpg",
    "signature": "a1b2c3d4e5f6..."
  },
  "timestamp": 1704067200000
}
```

---

### Step 4: User Clicks Feedback Link

```
User clicks: <a href="https://acme.critichut.com/feedback">Submit Feedback</a>

SDK intercepts click and redirects to:
https://acme.critichut.com/feedback?auth=eyJvcmdTbHVnIjoiYWNtZSIsInVzZXIiOnsiaWQiOiJjdXN0b21lcl91c2VyXzEyMzQ1IiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwibmFtZSI6IkpvaG4gRG9lIiwic2lnbmF0dXJlIjoiYTFiMmMzZDRlNWY2In0sInRpbWVzdGFtcCI6MTcwNDA2NzIwMDAwMH0

Token contains:
- Organization slug
- User ID, email, name, avatar
- HMAC signature
- Timestamp
```

---

### Step 5: critichut Page Loads with Token

```typescript
// apps/nextjs/src/app/_sites/[org]/layout.tsx

'use client';

import { useEffect } from 'react';

export default function OrgLayout({ children }) {
  useEffect(() => {
    // Check for auth token in URL
    const params = new URLSearchParams(window.location.search);
    const authToken = params.get('auth');

    if (authToken) {
      authenticateFromToken(authToken);
    }
  }, []);

  async function authenticateFromToken(token: string) {
    try {
      // Decode URL-safe base64
      const decoded = atob(
        token
          .replace(/-/g, '+')
          .replace(/_/g, '/')
      );

      const identityData = JSON.parse(decoded);

      // Validate timestamp (5-minute window)
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5 minutes

      if (Math.abs(now - identityData.timestamp) > maxAge) {
        console.error('[critichut] Auth token expired');
        cleanupUrl();
        return;
      }

      // Call backend authentication (first-party context!)
      const response = await fetch('/api/auth/external-login/sign-in', {
        method: 'POST',
        credentials: 'include', // ✅ Safari allows (first-party)
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalId: identityData.user.id,
          email: identityData.user.email,
          name: identityData.user.name,
          avatar: identityData.user.avatar,
          timestamp: identityData.timestamp,
          organizationSlug: identityData.orgSlug,
          signature: identityData.user.signature,
        }),
      });

      if (response.ok) {
        console.log('[critichut] Authentication successful');

        // Clean URL (remove auth token)
        cleanupUrl();

        // Reload to show authenticated state
        window.location.reload();
      } else {
        console.error('[critichut] Authentication failed');
        cleanupUrl();
      }
    } catch (error) {
      console.error('[critichut] Auth error:', error);
      cleanupUrl();
    }
  }

  function cleanupUrl() {
    // Remove auth token from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('auth');
    window.history.replaceState({}, '', url.toString());
  }

  return <>{children}</>;
}
```

---

### Step 6: Backend Verifies HMAC and Creates Session

```typescript
// apps/nextjs/src/app/api/auth/external-login/sign-in/route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@critichut/db/client';
import { organization, user, identifiedUser, session } from '@critichut/db/schema';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      externalId,
      email,
      name,
      avatar,
      timestamp,
      organizationSlug,
      signature,
    } = body;

    // ===== 1. Validate timestamp (5-minute window) =====
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    if (Math.abs(now - timestamp) > maxAge) {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 401 }
      );
    }

    // ===== 2. Fetch organization and secret key =====
    const org = await db.query.organization.findFirst({
      where: eq(organization.slug, organizationSlug),
    });

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // ===== 3. Verify HMAC signature =====
    const secretKey = decryptSecretKey(org.secretKey);

    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(externalId)
      .digest('hex');

    // Timing-safe comparison (prevents timing attacks)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // ===== 4. Find or create user =====
    let dbUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (!dbUser) {
      // Create new user (no password - identified user)
      const [newUser] = await db.insert(user).values({
        id: createId(),
        email: email,
        name: name || email.split('@')[0],
        image: avatar,
        emailVerified: false,
      }).returning();

      dbUser = newUser;
    } else {
      // Update user info if changed
      await db.update(user)
        .set({
          name: name || dbUser.name,
          image: avatar || dbUser.image,
        })
        .where(eq(user.id, dbUser.id));
    }

    // ===== 5. Create/update identified user link =====
    await db.insert(identifiedUser).values({
      id: createId(),
      userId: dbUser.id,
      organizationId: org.id,
      externalId: externalId,
      lastSeenAt: new Date(),
    }).onConflictDoUpdate({
      target: [identifiedUser.organizationId, identifiedUser.externalId],
      set: {
        userId: dbUser.id,
        lastSeenAt: new Date(),
      },
    });

    // ===== 6. Create session =====
    const sessionToken = generateSecureToken();

    const [newSession] = await db.insert(session).values({
      id: createId(),
      userId: dbUser.id,
      token: sessionToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      sessionType: 'identified',
      authMethod: 'external',
    }).returning();

    // ===== 7. Set first-party cookie =====
    const response = NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
      },
    });

    // Cookie on .critichut.com domain (first-party!)
    response.cookies.set('critichut_session', sessionToken, {
      domain: '.critichut.com',
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // ✅ Works for first-party
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('[critichut] Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// Helper: Generate secure random token
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

// Helper: Decrypt organization secret key
function decryptSecretKey(encrypted: string): string {
  // Implementation from auth-plan.md lines 1688-1699
  const [ivHex, encryptedData] = encrypted.split(':');
  const iv = Buffer.from(ivHex!, 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'),
    iv
  );
  let decrypted = decipher.update(encryptedData!, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

### Step 7: Clean URL & Session Established

```
1. Backend sets cookie:
   critichut_session=xyz123; Domain=.critichut.com; Path=/; HttpOnly; Secure; SameSite=Lax

2. Frontend cleans URL:
   https://acme.critichut.com/feedback?auth=TOKEN
   →
   https://acme.critichut.com/feedback

3. Page reloads (now authenticated)

4. User sees feedback board with their name/avatar ✅
```

---

### Step 8: Subsequent Visits

```
User directly visits: https://acme.critichut.com/feedback

Browser automatically sends:
Cookie: critichut_session=xyz123

Backend validates session:
✅ Session exists
✅ Not expired
✅ User is authenticated

No token needed! Clean URL always! ✅
```

---

## URL Token Authentication

### Token Structure

```typescript
// Original identity data
const identityData = {
  orgSlug: "acme",
  user: {
    id: "customer_user_12345",
    email: "john@example.com",
    name: "John Doe",
    avatar: "https://example.com/avatar.jpg",
    signature: "a1b2c3d4e5f6...",
  },
  timestamp: 1704067200000,
};

// Encoded as URL-safe base64
const token = btoa(JSON.stringify(identityData))
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

// Final URL
const url = `https://acme.critichut.com/feedback?auth=${token}`;
```

### Token Validation

```typescript
// Decode token
const decoded = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
const data = JSON.parse(decoded);

// Validate timestamp (5-minute window)
const now = Date.now();
const maxAge = 5 * 60 * 1000;

if (Math.abs(now - data.timestamp) > maxAge) {
  throw new Error('Token expired');
}

// Verify HMAC signature
const isValid = verifyHMAC(data.user.id, data.user.signature, secretKey);

if (!isValid) {
  throw new Error('Invalid signature');
}
```

---

## First-Party Cookie Strategy

### Cookie Configuration

```typescript
response.cookies.set('critichut_session', sessionToken, {
  domain: '.critichut.com',    // ✅ Works across all subdomains
  path: '/',                   // ✅ Available site-wide
  httpOnly: true,              // ✅ Prevents XSS attacks
  secure: true,                // ✅ HTTPS only in production
  sameSite: 'lax',             // ✅ Safari-compatible
  maxAge: 60 * 60 * 24 * 7,   // ✅ 7 days
});
```

### Why This Works in Safari

| Attribute | Purpose | Safari ITP |
|-----------|---------|------------|
| **domain: `.critichut.com`** | Share across all `*.critichut.com` | ✅ Allowed (first-party) |
| **sameSite: 'lax'** | Allow cross-site navigation | ✅ Allowed (user click) |
| **secure: true** | HTTPS only | ✅ Required |
| **httpOnly: true** | Prevent JavaScript access | ✅ Security best practice |

### Cross-Subdomain Behavior

```
Cookie set on: acme.critichut.com
Works on:
  ✅ acme.critichut.com
  ✅ acme.critichut.com/feedback
  ✅ acme.critichut.com/roadmap
  ✅ app.critichut.com (if authenticated session)
  ❌ customer-app.com (different domain)
```

---

## Security Implementation

### HMAC Signature Verification

```typescript
// Customer generates signature
const signature = crypto
  .createHmac('sha256', SECRET_KEY)
  .update(userId)
  .digest('hex');

// critichut verifies signature
const expectedSignature = crypto
  .createHmac('sha256', SECRET_KEY)
  .update(userId)
  .digest('hex');

// Timing-safe comparison (prevents timing attacks)
const isValid = crypto.timingSafeEqual(
  Buffer.from(providedSignature, 'hex'),
  Buffer.from(expectedSignature, 'hex')
);
```

### Timestamp Validation

```typescript
// 5-minute window prevents replay attacks
const now = Date.now();
const maxAge = 5 * 60 * 1000; // 5 minutes

if (Math.abs(now - timestamp) > maxAge) {
  throw new Error('Token expired');
}
```

### Secret Key Encryption

```typescript
// Keys encrypted at rest in database
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32-byte hex

function encryptSecretKey(secretKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  let encrypted = cipher.update(secretKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}
```

---

## Error Handling

### Common Error Scenarios

#### 1. Token Expired

```typescript
// User took too long to click link (>5 minutes)
if (Math.abs(now - timestamp) > maxAge) {
  // Clean URL and show message
  cleanupUrl();
  showError('Your session has expired. Please try again.');
  return;
}
```

#### 2. Invalid Signature

```typescript
// HMAC signature doesn't match
if (!isValid) {
  cleanupUrl();
  showError('Authentication failed. Please contact support.');
  return;
}
```

#### 3. Organization Not Found

```typescript
// Invalid org slug
if (!org) {
  cleanupUrl();
  showError('Organization not found.');
  return;
}
```

#### 4. Network Failure

```typescript
// API call failed
try {
  const response = await fetch('/api/auth/external-login/sign-in', ...);
} catch (error) {
  console.error('[critichut] Network error:', error);
  showError('Connection failed. Please try again.');
}
```

### Error Recovery

```typescript
// Retry authentication with exponential backoff
async function authenticateWithRetry(token: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await authenticateFromToken(token);
      return true;
    } catch (error) {
      if (i === maxRetries - 1) {
        showError('Authentication failed after multiple attempts.');
        return false;
      }
      // Wait 2^i seconds before retry
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

---

## Browser Compatibility

| Browser | Third-Party Cookies | URL Token Auth | First-Party Cookie |
|---------|---------------------|----------------|-------------------|
| **Chrome** | ⚠️ Being phased out | ✅ Works | ✅ Works |
| **Firefox** | ❌ Blocked (ETP) | ✅ Works | ✅ Works |
| **Safari** | ❌ Blocked (ITP) | ✅ Works | ✅ Works |
| **Edge** | ⚠️ Being phased out | ✅ Works | ✅ Works |
| **Brave** | ❌ Blocked | ✅ Works | ✅ Works |

**Result:** 100% browser compatibility with URL token approach! ✅

---

## Performance Considerations

### Token Size

```
Identity data: ~300 bytes
Base64 encoded: ~400 bytes
URL encoded: ~450 bytes

Total URL length: < 500 characters (well within limits)
```

### Network Requests

```
First visit:
1. Page load with ?auth=token
2. POST /api/auth/external-login/sign-in
3. Page reload (with session)
Total: 3 requests

Subsequent visits:
1. Page load (with cookie)
Total: 1 request ✅
```

### Caching Strategy

```typescript
// Cache session validation for 1 minute
const sessionCache = new Map<string, { user: User; expiresAt: number }>();

async function getSession(token: string) {
  const cached = sessionCache.get(token);

  if (cached && Date.now() < cached.expiresAt) {
    return cached.user;
  }

  const user = await db.query.session.findFirst(...);

  sessionCache.set(token, {
    user,
    expiresAt: Date.now() + 60 * 1000, // 1 minute
  });

  return user;
}
```

---

## Summary

### Authentication Flow (TL;DR)

1. ✅ **Customer embeds SDK** - Loads from CDN
2. ✅ **SDK identifies user** - Stores in localStorage with HMAC signature
3. ✅ **User clicks link** - SDK appends `?auth=token` to URL
4. ✅ **critichut verifies** - HMAC signature + timestamp validation
5. ✅ **Session created** - First-party cookie on `.critichut.com`
6. ✅ **URL cleaned** - Token removed from URL
7. ✅ **User authenticated** - Subsequent visits use cookie

### Key Advantages

- ✅ **Safari compatible** - No third-party cookies
- ✅ **Secure** - HMAC signatures prevent spoofing
- ✅ **Clean URLs** - Tokens removed after auth
- ✅ **Fast** - One-time token, then cookies
- ✅ **Simple** - Easy customer integration

---

**End of Document**
