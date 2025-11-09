# Customer Integration Guide

> **How customers integrate critichut auto-login into their applications**

**Last Updated:** 2025-11-08
**Difficulty:** Easy (15 minutes)
**Browser Support:** Chrome, Firefox, Safari, Edge

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Backend Integration](#backend-integration)
3. [Frontend Integration](#frontend-integration)
4. [Framework-Specific Guides](#framework-specific-guides)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 3-Step Integration

```
1. Generate HMAC signature on your backend
2. Embed critichut SDK on your frontend
3. Add feedback links to your app
```

**Total time:** ~15 minutes

---

## Backend Integration

### Step 1: Get Your Secret Key

1. Log into critichut dashboard: `https://app.critichut.com`
2. Go to your organization settings
3. Navigate to **API & Security** tab
4. Copy your **Secret Key** (keep this private!)

### Step 2: Create API Endpoint for Signature Generation

The signature **MUST** be generated on your backend (never in client-side JavaScript).

#### Node.js / Next.js

```typescript
// app/api/critichut/signature/route.ts

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth'; // Or your auth library

export async function GET(req: Request) {
  // Get current user from your auth system
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const user = session.user;

  // Generate HMAC signature (sign the user ID)
  const signature = crypto
    .createHmac('sha256', process.env.critichut_SECRET_KEY!)
    .update(user.id) // Sign user's unique ID
    .digest('hex');

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.image,
    },
    signature: signature,
  });
}
```

#### Express.js

```javascript
// routes/critichut.js

const express = require('express');
const crypto = require('crypto');
const router = express.Router();

router.get('/critichut/signature', (req, res) => {
  // Get current user from session
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = req.session.user;

  // Generate HMAC signature
  const signature = crypto
    .createHmac('sha256', process.env.critichut_SECRET_KEY)
    .update(user.id)
    .digest('hex');

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    },
    signature: signature,
  });
});

module.exports = router;
```

#### Python / Django

```python
# views.py

import hmac
import hashlib
import json
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

@login_required
def critichut_signature(request):
    user = request.user

    # Generate HMAC signature
    secret_key = settings.critichut_SECRET_KEY
    message = str(user.id).encode('utf-8')
    signature = hmac.new(
        secret_key.encode('utf-8'),
        message,
        hashlib.sha256
    ).hexdigest()

    return JsonResponse({
        'user': {
            'id': str(user.id),
            'email': user.email,
            'name': user.get_full_name(),
            'avatar': user.profile.avatar_url,
        },
        'signature': signature,
    })
```

#### Ruby / Rails

```ruby
# app/controllers/critichut_controller.rb

class critichutController < ApplicationController
  before_action :authenticate_user!

  def signature
    user = current_user

    # Generate HMAC signature
    secret_key = ENV['critichut_SECRET_KEY']
    signature = OpenSSL::HMAC.hexdigest('SHA256', secret_key, user.id.to_s)

    render json: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar_url
      },
      signature: signature
    }
  end
end
```

#### PHP / Laravel

```php
// routes/web.php

Route::get('/api/critichut/signature', function () {
    $user = Auth::user();

    if (!$user) {
        return response()->json(['error' => 'Unauthorized'], 401);
    }

    // Generate HMAC signature
    $secretKey = env('critichut_SECRET_KEY');
    $signature = hash_hmac('sha256', $user->id, $secretKey);

    return response()->json([
        'user' => [
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'avatar' => $user->avatar_url,
        ],
        'signature' => $signature,
    ]);
})->middleware('auth');
```

---

## Frontend Integration

### Step 3: Embed critichut SDK

Add the SDK to your HTML (works with any framework):

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <!-- Your app content -->

  <!-- critichut SDK (load from CDN) -->
  <script src="https://cdn.critichut.com/sdk.js" async></script>

  <!-- Initialize critichut -->
  <script>
    window.addEventListener('critichut:ready', async () => {
      // Fetch user signature from your backend
      const response = await fetch('/api/critichut/signature');
      const data = await response.json();

      // Initialize critichut with your organization slug
      window.critichut.init('YOUR_ORG_SLUG', {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          avatar: data.user.avatar,
          signature: data.signature,
        }
      });
    });
  </script>
</body>
</html>
```

**Replace `YOUR_ORG_SLUG`** with your organization's slug (e.g., `acme`).

### Step 4: Add Feedback Links

Just add regular HTML links - the SDK automatically enhances them!

```html
<!-- Navigation -->
<nav>
  <a href="https://YOUR_ORG_SLUG.critichut.com/feedback">
    Submit Feedback
  </a>
  <a href="https://YOUR_ORG_SLUG.critichut.com/roadmap">
    View Roadmap
  </a>
</nav>

<!-- Button -->
<button onclick="window.location.href='https://YOUR_ORG_SLUG.critichut.com/feedback'">
  Give Feedback
</button>

<!-- Footer -->
<footer>
  <a href="https://YOUR_ORG_SLUG.critichut.com/feedback">
    Feature Requests
  </a>
</footer>
```

**That's it!** Users will be automatically logged into critichut when they click the link.

---

## Framework-Specific Guides

### React

```typescript
// App.tsx

import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Load SDK
    const script = document.createElement('script');
    script.src = 'https://cdn.critichut.com/sdk.js';
    script.async = true;
    document.body.appendChild(script);

    // Initialize when ready
    const handleReady = async () => {
      try {
        const response = await fetch('/api/critichut/signature');
        const data = await response.json();

        window.critichut.init('YOUR_ORG_SLUG', {
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            avatar: data.user.avatar,
            signature: data.signature,
          }
        });
      } catch (error) {
        console.error('critichut init failed:', error);
      }
    };

    window.addEventListener('critichut:ready', handleReady);

    // Cleanup
    return () => {
      window.removeEventListener('critichut:ready', handleReady);
    };
  }, []);

  return (
    <div>
      <header>
        <a href="https://YOUR_ORG_SLUG.critichut.com/feedback">
          Submit Feedback
        </a>
      </header>
    </div>
  );
}

export default App;
```

### Next.js (App Router)

```typescript
// app/layout.tsx

import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}

        {/* Load critichut SDK */}
        <Script
          src="https://cdn.critichut.com/sdk.js"
          strategy="afterInteractive"
        />

        {/* Initialize critichut */}
        <Script id="critichut-init" strategy="afterInteractive">
          {`
            window.addEventListener('critichut:ready', async () => {
              try {
                const res = await fetch('/api/critichut/signature');
                const data = await res.json();

                window.critichut.init('YOUR_ORG_SLUG', {
                  user: {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.name,
                    avatar: data.user.avatar,
                    signature: data.signature,
                  }
                });
              } catch (error) {
                console.error('critichut init failed:', error);
              }
            });
          `}
        </Script>
      </body>
    </html>
  );
}
```

```typescript
// components/FeedbackLink.tsx

export function FeedbackLink() {
  return (
    <a
      href="https://YOUR_ORG_SLUG.critichut.com/feedback"
      className="btn btn-primary"
    >
      Submit Feedback
    </a>
  );
}
```

### Vue.js

```vue
<!-- App.vue -->

<template>
  <div>
    <header>
      <a href="https://YOUR_ORG_SLUG.critichut.com/feedback">
        Submit Feedback
      </a>
    </header>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(() => {
  // Load SDK
  const script = document.createElement('script');
  script.src = 'https://cdn.critichut.com/sdk.js';
  script.async = true;
  document.body.appendChild(script);

  // Initialize when ready
  window.addEventListener('critichut:ready', async () => {
    try {
      const response = await fetch('/api/critichut/signature');
      const data = await response.json();

      window.critichut.init('YOUR_ORG_SLUG', {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          avatar: data.user.avatar,
          signature: data.signature,
        }
      });
    } catch (error) {
      console.error('critichut init failed:', error);
    }
  });
});
</script>
```

### Svelte

```svelte
<!-- App.svelte -->

<script lang="ts">
  import { onMount } from 'svelte';

  onMount(() => {
    // Load SDK
    const script = document.createElement('script');
    script.src = 'https://cdn.critichut.com/sdk.js';
    script.async = true;
    document.body.appendChild(script);

    // Initialize when ready
    window.addEventListener('critichut:ready', async () => {
      try {
        const response = await fetch('/api/critichut/signature');
        const data = await response.json();

        window.critichut.init('YOUR_ORG_SLUG', {
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            avatar: data.user.avatar,
            signature: data.signature,
          }
        });
      } catch (error) {
        console.error('critichut init failed:', error);
      }
    });
  });
</script>

<header>
  <a href="https://YOUR_ORG_SLUG.critichut.com/feedback">
    Submit Feedback
  </a>
</header>
```

### Angular

```typescript
// app.component.ts

import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Load SDK
    const script = document.createElement('script');
    script.src = 'https://cdn.critichut.com/sdk.js';
    script.async = true;
    document.body.appendChild(script);

    // Initialize when ready
    window.addEventListener('critichut:ready', async () => {
      try {
        this.http.get('/api/critichut/signature').subscribe((data: any) => {
          window.critichut.init('YOUR_ORG_SLUG', {
            user: {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              avatar: data.user.avatar,
              signature: data.signature,
            }
          });
        });
      } catch (error) {
        console.error('critichut init failed:', error);
      }
    });
  }
}
```

```html
<!-- app.component.html -->

<header>
  <a href="https://YOUR_ORG_SLUG.critichut.com/feedback">
    Submit Feedback
  </a>
</header>
```

---

## Testing

### Test Your Integration

1. **Check signature generation:**
   ```bash
   curl -H "Cookie: your_session_cookie" http://localhost:3000/api/critichut/signature
   ```

   Should return:
   ```json
   {
     "user": {
       "id": "user_123",
       "email": "test@example.com",
       "name": "Test User",
       "avatar": "https://..."
     },
     "signature": "a1b2c3d4e5f6..."
   }
   ```

2. **Check SDK initialization:**
   - Open your app in browser
   - Open DevTools Console
   - Look for: `[critichut] Initialized for org: YOUR_ORG_SLUG`
   - Look for: `[critichut] User identified: test@example.com`

3. **Test auto-login:**
   - Click a feedback link
   - Should redirect to: `https://YOUR_ORG_SLUG.critichut.com/feedback?auth=...`
   - URL should clean to: `https://YOUR_ORG_SLUG.critichut.com/feedback`
   - You should see your name/avatar in critichut
   - You should be able to submit feedback

### Browser Compatibility Test

Test in all major browsers:

- ✅ Chrome
- ✅ Firefox
- ✅ Safari (important - uses different cookie policy)
- ✅ Edge
- ✅ Brave

---

## Troubleshooting

### Issue: "Invalid signature" error

**Cause:** HMAC signature doesn't match

**Solutions:**
1. Check secret key is correct (from critichut dashboard)
2. Ensure you're signing the user ID (not email or other field)
3. Verify signature is hex-encoded (not base64)

```typescript
// ✅ Correct
const signature = crypto
  .createHmac('sha256', SECRET_KEY)
  .update(user.id) // Sign user ID
  .digest('hex');  // Hex encoding

// ❌ Wrong
const signature = crypto
  .createHmac('sha256', SECRET_KEY)
  .update(user.email) // ❌ Don't sign email
  .digest('base64'); // ❌ Wrong encoding
```

### Issue: "Token expired" error

**Cause:** User took too long to click link (>5 minutes)

**Solution:** This is normal - user just needs to click the link again. Token is regenerated on each page load.

### Issue: SDK not initializing

**Cause:** Script loaded before event listener attached

**Solution:** Check script loading order:

```html
<!-- ❌ Wrong order -->
<script>
  window.addEventListener('critichut:ready', ...); // Listener added
</script>
<script src="https://cdn.critichut.com/sdk.js"></script> <!-- SDK loads

<!-- ✅ Correct order -->
<script src="https://cdn.critichut.com/sdk.js"></script> <!-- SDK loads first
<script>
  window.addEventListener('critichut:ready', ...); // Then listener
</script>
```

### Issue: Links not being enhanced

**Cause:** Links added after SDK initialization

**Solution:** Call `refreshLinks()` after adding dynamic links:

```typescript
// Add new links dynamically
const link = document.createElement('a');
link.href = 'https://acme.critichut.com/feedback';
link.textContent = 'Feedback';
document.body.appendChild(link);

// Refresh link enhancement
window.critichut.refreshLinks();
```

### Issue: Auto-login doesn't work in Safari

**Cause:** This is expected behavior - auto-login uses URL tokens, not third-party cookies

**Solution:** No action needed. The URL token approach works perfectly in Safari. Users might see `?auth=token` briefly in URL, but it's removed immediately after authentication.

### Issue: User sees auth token in URL

**Cause:** Page didn't reload after authentication

**Solution:** Check that cleanup code is running:

```typescript
// Should clean URL after auth
const url = new URL(window.location.href);
url.searchParams.delete('auth');
window.history.replaceState({}, '', url.toString());
window.location.reload(); // Reload to show authenticated state
```

### Issue: "Organization not found"

**Cause:** Wrong organization slug

**Solution:** Check your org slug in critichut dashboard:
1. Go to `https://app.critichut.com`
2. Settings → Organization
3. Copy exact slug (e.g., `acme`, not `Acme` or `ACME`)

---

## Advanced Configuration

### Custom Auth Endpoint (for testing)

```typescript
window.critichut.init('YOUR_ORG_SLUG', {
  user: userData,
  authEndpoint: 'http://localhost:3000/api/auth/external-login',
});
```

### Debug Mode

```typescript
window.critichut.init('YOUR_ORG_SLUG', {
  user: userData,
  debug: true, // Enable verbose logging
});
```

### Manual Link Enhancement

```typescript
// Don't auto-enhance links
window.critichut.init('YOUR_ORG_SLUG', {
  user: userData,
  autoEnhance: false,
});

// Manually enhance specific links
const link = document.querySelector('#feedback-link');
link.addEventListener('click', (e) => {
  e.preventDefault();
  const url = window.critichut.generateAuthUrl(link.href);
  window.location.href = url;
});
```

---

## Security Best Practices

### ✅ DO:

- Generate signatures on your backend (server-side only)
- Use environment variables for secret keys
- Validate user session before generating signature
- Use HTTPS in production
- Keep secret keys private (never commit to Git)

### ❌ DON'T:

- Generate signatures in client-side JavaScript
- Expose secret keys in frontend code
- Share secret keys publicly
- Use same secret across multiple organizations

### Example: Secure Environment Variables

```bash
# .env (never commit this file!)
critichut_SECRET_KEY=your_secret_key_here
```

```javascript
// next.config.js
module.exports = {
  env: {
    // ❌ DON'T expose secret key to client
    // critichut_SECRET_KEY: process.env.critichut_SECRET_KEY,
  },
};
```

```typescript
// ✅ DO: Use secret key only in API routes (server-side)
export async function GET(req: Request) {
  const signature = crypto
    .createHmac('sha256', process.env.critichut_SECRET_KEY!)
    .update(userId)
    .digest('hex');

  return Response.json({ signature });
}
```

---

## Getting Help

### Support Channels

- **Documentation:** https://docs.critichut.com
- **Email:** support@critichut.com
- **Google:** https://google.gg/critichut
- **GitHub Issues:** https://github.com/critichut/critichut

### Frequently Asked Questions

**Q: Do I need to install any npm packages?**
A: No! Just load the SDK from CDN via `<script>` tag.

**Q: Can I use this with mobile apps?**
A: Yes! Use a WebView and the SDK works the same way.

**Q: Does this work with SSR (Server-Side Rendering)?**
A: Yes! The SDK only runs in the browser, so it works with Next.js, Remix, etc.

**Q: Can I customize the feedback widget appearance?**
A: Yes! Go to your organization settings in critichut dashboard.

**Q: Is there a cost per user?**
A: No! critichut pricing is based on organizations, not identified users.

---

## Quick Reference

### SDK Methods

```typescript
// Initialize
window.critichut.init(orgSlug: string, config?: critichutConfig)

// Identify user
window.critichut.identify(user: critichutUser)

// Logout
window.critichut.logout()

// Get current user
window.critichut.getUser(): critichutUser | null

// Check if identified
window.critichut.isIdentified(): boolean

// Refresh links (for SPAs)
window.critichut.refreshLinks()
```

### User Object

```typescript
interface critichutUser {
  id: string;        // Required: User's unique ID
  email: string;     // Required: User's email
  name?: string;     // Optional: Display name
  avatar?: string;   // Optional: Avatar URL
  signature: string; // Required: HMAC signature
}
```

---

**Need help? Contact support@critichut.com**
